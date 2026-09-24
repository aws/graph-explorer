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
import { planDiscovery, toEdgeTotal } from "./discoveryPlan";
import edgeConnectionsTemplate, {
  projectionKeys,
} from "./edgeConnectionsTemplate";

/** Every label of one endpoint vertex, folded by the template. */
type EndpointLabels = { "@type": "g:List"; "@value": string[] };

/** The projected labels that key one `groupCount()` entry. */
type ProjectedLabels = GMapWithValue<string, string | EndpointLabels>;

/** Endpoint label combinations counted by `groupCount()`. */
type CountedLabels = GMapWithValue<ProjectedLabels, GInt64>;

type RawResponse<Value> = {
  result: { data: { "@type": "g:List"; "@value": Value[] } };
};

/**
 * A scan returns one map keyed by the `(e, s, t)` projection, or an empty one
 * when no edge matched.
 */
type RawScanResponse = RawResponse<CountedLabels>;

/** A sample returns one map from edge type to its `(s, t)` counts. */
type RawSampleResponse = RawResponse<GMapWithValue<string, CountedLabels>>;

/** One endpoint label combination, read by key before it is validated. */
type Combination = {
  edgeType: string | EndpointLabels | undefined;
  sourceLabels: string | EndpointLabels | undefined;
  targetLabels: string | EndpointLabels | undefined;
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
    {
      ...attempt,
      strategy: plan.strategy,
      requests: plan.requests.length,
      // Through the same guard the planner used, so the error reports the total
      // the plan was actually made from. The raw value is cast out of a response
      // and may not be a number at all.
      totalEdges: toEdgeTotal(attempt.totalEdges),
    },
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
      async request => {
        const response = await gremlinFetch<
          RawScanResponse | RawSampleResponse
        >(edgeConnectionsTemplate(request), {
          // Per request, so the proxy cancels this scan at the database rather
          // than whatever else the connection happens to be doing.
          queryId: v4(),
          signal: anySignal(abandon.signal, requestTimeoutSignal(plan)),
        });
        return "limitPerType" in request
          ? sampledCombinations(response as RawSampleResponse)
          : scannedCombinations(response as RawScanResponse);
      },
    );

    const edgeConnections = parseEdgeConnections(
      responses.flat(),
      schemaEdgeTypes,
    );
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
  combinations: Combination[],
  schemaEdgeTypes: EdgeType[],
): EdgeConnection[] {
  const knownEdgeTypes = new Set<string>(schemaEdgeTypes);
  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const { edgeType, sourceLabels, targetLabels } of combinations) {
    if (typeof edgeType !== "string" || !knownEdgeTypes.has(edgeType)) {
      continue;
    }

    for (const sourceType of endpointTypes(sourceLabels)) {
      for (const targetType of endpointTypes(targetLabels)) {
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

  return edgeConnections;
}

function scannedCombinations(response: RawScanResponse): Combination[] {
  return response.result.data["@value"].flatMap(counts =>
    [...parseGMap<ProjectedLabels, GInt64>(counts).keys()].map(key => {
      const labels = parseGMap<string, string | EndpointLabels>(key);
      return {
        edgeType: labels.get(projectionKeys.edgeType),
        sourceLabels: labels.get(projectionKeys.sourceType),
        targetLabels: labels.get(projectionKeys.targetType),
      };
    }),
  );
}

function sampledCombinations(response: RawSampleResponse): Combination[] {
  return response.result.data["@value"].flatMap(byEdgeType =>
    [...parseGMap<string, CountedLabels>(byEdgeType)].flatMap(
      ([edgeType, counts]) =>
        [...parseGMap<ProjectedLabels, GInt64>(counts).keys()].map(key => {
          const labels = parseGMap<string, string | EndpointLabels>(key);
          return {
            edgeType,
            sourceLabels: labels.get(projectionKeys.sourceType),
            targetLabels: labels.get(projectionKeys.targetType),
          };
        }),
    ),
  );
}

/**
 * Expands one endpoint's folded labels into vertex types. Neptune 1.4 folds a
 * multi-label vertex into one `::` composite, 1.3.5 into one entry per label, so
 * every entry is split.
 */
function endpointTypes(labels: string | EndpointLabels | undefined): string[] {
  if (labels === undefined || typeof labels === "string") {
    return [];
  }
  return labels["@value"].flatMap(label => splitLabel(label));
}
