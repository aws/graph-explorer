import type { EdgeConnectionDiscovery } from "@shared/types";

import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import {
  createEdgeType,
  createVertexType,
  type EdgeConnection,
  type EdgeType,
} from "@/core";
import {
  DEFAULT_CONCURRENT_REQUESTS_LIMIT,
  logger,
  mapWithConcurrency,
  NetworkError,
} from "@/utils";

import type { GInt64, GMapWithValue, GremlinFetch } from "../types";
import type { DiscoveryPlan, DiscoveryRequest } from "./discoveryPlan";

import { parseGMap } from "../mappers/parseGMap";
import { splitLabel } from "../splitLabel";
import { planDiscovery } from "./discoveryPlan";
import edgeConnectionsTemplate, {
  projectionKeys,
} from "./edgeConnectionsTemplate";

/** The projected triple that keys one `groupCount()` entry. */
type ProjectedTriple = GMapWithValue<string, string>;

type RawEdgeConnectionsResponse = {
  result: {
    data: {
      "@type": "g:List";
      // groupCount() returns a single g:Map keyed by the projected triple, or an
      // empty one when no edge matched.
      "@value": Array<GMapWithValue<ProjectedTriple, GInt64>>;
    };
  };
};

/**
 * Neptune's codes for a query that needed more of the instance than it could
 * have. No other engine reports an equivalent, which is why our own fetch
 * timeout is the primary trigger and these are only a fast path.
 */
const TOO_BIG_ERROR_CODES = [
  "MemoryLimitExceededException",
  "TimeLimitExceededException",
];

export default async function fetchEdgeConnections(
  gremlinFetch: GremlinFetch,
  req: EdgeConnectionsRequest,
  discovery: EdgeConnectionDiscovery,
): Promise<EdgeConnectionsResponse> {
  const plan = planDiscovery({
    edgeTypes: req.edgeTypes,
    totalEdges: req.totalEdges,
    discovery,
  });

  logger.log("Edge connection discovery plan", {
    strategy: plan.strategy,
    requests: plan.requests.length,
    edgeTypes: req.edgeTypes.length,
    totalEdges: req.totalEdges,
    discovery,
  });

  try {
    return await runPlan(gremlinFetch, plan.requests, req.edgeTypes);
  } catch (error) {
    if (!shouldDegradeToSampled(plan, discovery, error)) {
      throw error;
    }

    logger.warn(
      "A complete edge connection scan was too large for the database, sampling each edge type instead",
      error,
    );
    const sampled = planDiscovery({
      edgeTypes: req.edgeTypes,
      totalEdges: req.totalEdges,
      discovery: "sampled",
    });
    return runPlan(gremlinFetch, sampled.requests, req.edgeTypes);
  }
}

async function runPlan(
  gremlinFetch: GremlinFetch,
  requests: DiscoveryRequest[],
  schemaEdgeTypes: EdgeType[],
): Promise<EdgeConnectionsResponse> {
  const responses = await mapWithConcurrency(
    requests,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    request =>
      gremlinFetch<RawEdgeConnectionsResponse>(
        edgeConnectionsTemplate(request),
      ),
  );

  return { edgeConnections: parseEdgeConnections(responses, schemaEdgeTypes) };
}

/**
 * Whether a failed complete scan should be abandoned and redone as sampled.
 *
 * Only on the automatic path. A user who asked for complete gets the failure
 * reported, because silently sampling would contradict the setting. A sampled
 * pass never degrades either, since there is nothing cheaper to fall back to.
 */
function shouldDegradeToSampled(
  plan: DiscoveryPlan,
  discovery: EdgeConnectionDiscovery,
  error: unknown,
): boolean {
  return (
    plan.strategy === "complete" && discovery === "auto" && isTooBig(error)
  );
}

function isTooBig(error: unknown): boolean {
  const code = error instanceof NetworkError ? error.data?.code : undefined;
  if (typeof code === "string") {
    return TOO_BIG_ERROR_CODES.includes(code);
  }
  // Our own fetch timeout, which is the only size signal a non-Neptune engine
  // gives us. A user-initiated cancellation raises `AbortError` and must not
  // look like a size problem.
  return error instanceof DOMException && error.name === "TimeoutError";
}

/**
 * Flattens the counted triples into edge connections, expanding Neptune `::`
 * composite labels on both endpoints.
 *
 * The counts are read and discarded. `EdgeConnection.count` stays unpopulated
 * because the same field would be capped, and so misleading, whenever the
 * sampled strategy produced it.
 *
 * @param schemaEdgeTypes Edge types the app can render. An unfiltered scan sees
 *   every edge type in the graph, including ones discovery was not asked about.
 */
function parseEdgeConnections(
  responses: RawEdgeConnectionsResponse[],
  schemaEdgeTypes: EdgeType[],
): EdgeConnection[] {
  const knownEdgeTypes = new Set<string>(schemaEdgeTypes);
  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const response of responses) {
    for (const counts of response.result.data["@value"]) {
      for (const triple of parseGMap(counts).keys()) {
        const labels = parseGMap<string, string>(triple);
        const edgeType = labels.get(projectionKeys.edgeType);
        const sourceLabel = labels.get(projectionKeys.sourceType);
        const targetLabel = labels.get(projectionKeys.targetType);

        if (
          !edgeType ||
          !sourceLabel ||
          !targetLabel ||
          !knownEdgeTypes.has(edgeType)
        ) {
          continue;
        }

        for (const sourceType of splitLabel(sourceLabel)) {
          for (const targetType of splitLabel(targetLabel)) {
            const key = `${sourceType}-${edgeType}-${targetType}`;
            if (seen.has(key)) {
              continue;
            }
            seen.add(key);
            edgeConnections.push({
              sourceVertexType: createVertexType(sourceType),
              edgeType: createEdgeType(edgeType),
              targetVertexType: createVertexType(targetType),
            });
          }
        }
      }
    }
  }

  return edgeConnections;
}
