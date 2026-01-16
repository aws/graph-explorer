import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import { createEdgeType, createVertexType, type EdgeConnection } from "@/core";
import batchPromisesSerially from "@/utils/batchPromisesSerially";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";

import type { OpenCypherFetch } from "../types";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

type RawEdgeConnectionsResponse = {
  results: Array<{
    sourceLabels: string[];
    targetLabels: string[];
  }>;
};

export default async function fetchEdgeConnections(
  openCypherFetch: OpenCypherFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const results = await batchPromisesSerially(
    req.edgeTypes,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async edgeType => {
      const template = edgeConnectionsTemplate(edgeType);
      const data = await openCypherFetch<RawEdgeConnectionsResponse>(template);
      return { edgeType, values: data.results || [] };
    },
  );

  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const { edgeType, values } of results) {
    for (const item of values) {
      const sourceLabels = item.sourceLabels || [];
      const targetLabels = item.targetLabels || [];

      // Create connections for each combination of source and target labels
      for (const sourceType of sourceLabels) {
        for (const targetType of targetLabels) {
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
