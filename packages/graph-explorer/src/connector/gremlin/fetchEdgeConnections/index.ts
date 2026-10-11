import { chunk } from "lodash";

import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import {
  createEdgeConnectionId,
  createEdgeType,
  createVertexType,
  type EdgeConnection,
} from "@/core";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT, mapWithConcurrency } from "@/utils";

import type { GInt64, GMapWithValue, GremlinFetch } from "../types";

import { parseGMap } from "../mappers/parseGMap";
import { splitLabel } from "../splitLabel";
import edgeConnectionsTemplate, {
  projectionKeys,
} from "./edgeConnectionsTemplate";

/** Edge types per request. See {@link edgeConnectionsTemplate}. */
const EDGE_TYPES_PER_SAMPLE = 10;

/** Every label of one endpoint vertex, folded by the template. */
type EndpointLabels = { "@type": "g:List"; "@value": string[] };

/** The projected labels that key one `groupCount()` entry. */
type ProjectedLabels = GMapWithValue<string, EndpointLabels>;

/** Endpoint label combinations counted by `groupCount()`. */
type CountedLabels = GMapWithValue<ProjectedLabels, GInt64>;

/** One map from edge type to its `(s, t)` counts. */
type RawEdgeConnectionsResponse = {
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<GMapWithValue<string, CountedLabels>>;
    };
  };
};

/** One endpoint label combination, read by key before it is validated. */
type Combination = {
  edgeType: string;
  sourceLabels: EndpointLabels | undefined;
  targetLabels: EndpointLabels | undefined;
};

export default async function fetchEdgeConnections(
  gremlinFetch: GremlinFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const batches = chunk(req.edgeTypes, EDGE_TYPES_PER_SAMPLE);
  const responses = await mapWithConcurrency(
    batches,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    batch =>
      gremlinFetch<RawEdgeConnectionsResponse>(
        edgeConnectionsTemplate({ types: batch }),
      ),
  );

  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const { edgeType, sourceLabels, targetLabels } of responses.flatMap(
    sampledCombinations,
  )) {
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

  return { edgeConnections };
}

/**
 * Reads the counted endpoint label combinations by key. The counts are
 * discarded, because a sampled count is capped and so would mislead.
 */
function sampledCombinations(
  response: RawEdgeConnectionsResponse,
): Combination[] {
  return response.result.data["@value"].flatMap(byEdgeType =>
    [...parseGMap<string, CountedLabels>(byEdgeType)].flatMap(
      ([edgeType, counts]) =>
        [...parseGMap<ProjectedLabels, GInt64>(counts).keys()].map(key => {
          const labels = parseGMap<string, EndpointLabels>(key);
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
function endpointTypes(labels: EndpointLabels | undefined): string[] {
  return labels?.["@value"].flatMap(label => splitLabel(label)) ?? [];
}
