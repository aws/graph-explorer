import type { EdgeConnectionDiscovery } from "@shared/types";

import { v4 } from "uuid";

import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import {
  createEdgeConnectionId,
  createEdgeType,
  createVertexType,
  type EdgeConnection,
  type EdgeType,
} from "@/core";
import {
  DEFAULT_CONCURRENT_REQUESTS_LIMIT,
  logger,
  mapWithConcurrency,
} from "@/utils";

import type { GInt64, GMapWithValue, GremlinFetch } from "../types";
import type { FailedDiscovery } from "./discoveryError";
import type { DiscoveryPlan } from "./discoveryPlan";

import { anySignal } from "../../utils/anySignal";
import { parseGMap } from "../mappers/parseGMap";
import { splitLabel } from "../splitLabel";
import { EdgeConnectionDiscoveryError, isTooBig } from "./discoveryError";
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

  logger.log("[Edge connection discovery] Planned", {
    strategy: plan.strategy,
    requests: plan.requests.length,
    requestTimeoutMs: plan.requestTimeoutMs,
    edgeTypes: req.edgeTypes.length,
    totalEdges: req.totalEdges,
    setting: discovery,
  });

  try {
    return await runPlan(gremlinFetch, plan, req.edgeTypes);
  } catch (error) {
    if (!isTooBig(error)) {
      throw error;
    }

    // A user who asked for complete gets the failure reported, because silently
    // sampling would contradict the setting. A sampled pass has nothing cheaper
    // to fall back to.
    if (plan.strategy !== "complete" || discovery !== "auto") {
      throw giveUp(
        plan,
        { setting: discovery, totalEdges: req.totalEdges, degraded: false },
        error,
      );
    }

    logger.warn(
      "[Edge connection discovery] A complete scan was too large for the database, sampling each edge type instead",
      error,
    );

    const sampled = planDiscovery({
      edgeTypes: req.edgeTypes,
      totalEdges: req.totalEdges,
      discovery: "sampled",
    });

    try {
      return await runPlan(gremlinFetch, sampled, req.edgeTypes);
    } catch (sampledError) {
      if (!isTooBig(sampledError)) {
        throw sampledError;
      }
      throw giveUp(
        sampled,
        { setting: discovery, totalEdges: req.totalEdges, degraded: true },
        sampledError,
      );
    }
  }
}

/** Reports a size failure with the recovery path that is still open. */
function giveUp(
  plan: DiscoveryPlan,
  attempt: Omit<FailedDiscovery, "strategy" | "requests">,
  cause: unknown,
): EdgeConnectionDiscoveryError {
  const error = new EdgeConnectionDiscoveryError(
    { ...attempt, strategy: plan.strategy, requests: plan.requests.length },
    cause,
  );
  logger.error(`[Edge connection discovery] Gave up. ${error.recovery}`, error);
  return error;
}

async function runPlan(
  gremlinFetch: GremlinFetch,
  plan: DiscoveryPlan,
  schemaEdgeTypes: EdgeType[],
): Promise<EdgeConnectionsResponse> {
  const startedAt = performance.now();
  const abandon = new AbortController();

  try {
    const responses = await mapWithConcurrency(
      plan.requests,
      DEFAULT_CONCURRENT_REQUESTS_LIMIT,
      request =>
        gremlinFetch<RawEdgeConnectionsResponse>(
          edgeConnectionsTemplate(request),
          {
            // Per request, so the proxy cancels this scan at the database rather
            // than whatever else the connection happens to be doing.
            queryId: v4(),
            signal: anySignal(abandon.signal, requestTimeoutSignal(plan)),
          },
        ),
    );

    const edgeConnections = parseEdgeConnections(responses, schemaEdgeTypes);
    logger.log("[Edge connection discovery] Finished", {
      strategy: plan.strategy,
      requests: plan.requests.length,
      edgeConnections: edgeConnections.length,
      elapsedMs: Math.round(performance.now() - startedAt),
    });
    return { edgeConnections };
  } finally {
    // Whatever is still in flight belongs to an attempt nobody is waiting for
    // any more. Aborting closes the connection to the proxy, which turns that
    // into a `cancelQuery` for the `queryId` the request carried, so the
    // database stops scanning too.
    abandon.abort();
  }
}

function requestTimeoutSignal(plan: DiscoveryPlan): AbortSignal | undefined {
  return plan.requestTimeoutMs === undefined
    ? undefined
    : AbortSignal.timeout(plan.requestTimeoutMs);
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
            const connection: EdgeConnection = {
              sourceVertexType: createVertexType(sourceType),
              edgeType: createEdgeType(edgeType),
              targetVertexType: createVertexType(targetType),
            };
            // Keyed through the canonical id builder because its bracket
            // delimiters cannot collide, unlike joining three labels that may
            // themselves contain the separator.
            const key = createEdgeConnectionId(connection);
            if (seen.has(key)) {
              continue;
            }
            seen.add(key);
            edgeConnections.push(connection);
          }
        }
      }
    }
  }

  return edgeConnections;
}
