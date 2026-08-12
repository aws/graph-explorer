import { chunk } from "lodash";

import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import { createEdgeType, createVertexType, type EdgeConnection } from "@/core";
import {
  DEFAULT_BATCH_REQUEST_SIZE,
  DEFAULT_CONCURRENT_REQUESTS_LIMIT,
  mapWithConcurrency,
} from "@/utils";

import type { GList, GMapWithValue, GremlinFetch } from "../types";

import { parseGMap } from "../mappers/parseGMap";
import { splitLabel } from "../splitLabel";
import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

type RawEdgeConnectionsResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      // group().by(label()).by(...) returns a single g:Map keyed by edge label,
      // each value a g:List of the projected {sourceType, targetType} g:Maps.
      "@value": Array<GMapWithValue<string, GList>>;
    };
  };
};

/**
 * Expands one edge type's folded pair list into edge connections, splitting
 * Neptune `::` composite labels on both endpoints. Localizes the GraphSON pair
 * cast to this boundary.
 */
function connectionsFromPairs(
  edgeType: string,
  pairs: GList,
): EdgeConnection[] {
  const connections: EdgeConnection[] = [];

  for (const pair of pairs["@value"]) {
    const map = parseGMap<string, string>(
      pair as GMapWithValue<string, string>,
    );
    const sourceValue = map.get("sourceType");
    const targetValue = map.get("targetType");

    if (!sourceValue || !targetValue) {
      continue;
    }

    for (const sourceType of splitLabel(sourceValue)) {
      for (const targetType of splitLabel(targetValue)) {
        connections.push({
          sourceVertexType: createVertexType(sourceType),
          edgeType: createEdgeType(edgeType),
          targetVertexType: createVertexType(targetType),
        });
      }
    }
  }

  return connections;
}

export default async function fetchEdgeConnections(
  gremlinFetch: GremlinFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const batches = chunk(req.edgeTypes, DEFAULT_BATCH_REQUEST_SIZE);
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

  for (const data of responses) {
    for (const group of data.result.data["@value"]) {
      for (const [edgeType, pairs] of parseGMap<string, GList>(group)) {
        for (const connection of connectionsFromPairs(edgeType, pairs)) {
          const key = `${connection.sourceVertexType}-${connection.edgeType}-${connection.targetVertexType}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          edgeConnections.push(connection);
        }
      }
    }
  }

  return { edgeConnections };
}
