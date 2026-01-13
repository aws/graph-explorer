import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import { createEdgeType, createVertexType, type EdgeConnection } from "@/core";
import batchPromisesSerially from "@/utils/batchPromisesSerially";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";

import type { GremlinFetch } from "../types";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

type GEdgeConnectionValue = {
  "@type": "g:Map";
  "@value": Array<string>;
};

type RawEdgeConnectionsResponse = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<GEdgeConnectionValue>;
    };
  };
};

export default async function fetchEdgeConnections(
  gremlinFetch: GremlinFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const results = await batchPromisesSerially(
    req.edgeTypes,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async edgeType => {
      const template = edgeConnectionsTemplate(edgeType);
      const data = await gremlinFetch<RawEdgeConnectionsResponse>(template);
      return { edgeType, values: data.result.data["@value"] };
    },
  );

  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const { edgeType, values } of results) {
    for (const item of values) {
      const mapValues = item["@value"];
      // Map format: ['sourceType', value, 'targetType', value]
      // Neptune multi-label vertices use :: delimiter
      const sourceTypes = mapValues[1].split("::").filter(Boolean);
      const targetTypes = mapValues[3].split("::").filter(Boolean);

      for (const sourceType of sourceTypes) {
        for (const targetType of targetTypes) {
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

  return { edgeConnections };
}
