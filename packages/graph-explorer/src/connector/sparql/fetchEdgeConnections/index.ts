import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import { createEdgeType, createVertexType, type EdgeConnection } from "@/core";
import batchPromisesSerially from "@/utils/batchPromisesSerially";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";

import type { SparqlFetch } from "../types";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

type RawEdgeConnectionsResponse = {
  results: {
    bindings: Array<{
      sourceType: { type: string; value: string };
      targetType: { type: string; value: string };
    }>;
  };
};

export default async function fetchEdgeConnections(
  sparqlFetch: SparqlFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const results = await batchPromisesSerially(
    req.edgeTypes,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    async edgeType => {
      const template = edgeConnectionsTemplate(edgeType);
      const data = await sparqlFetch<RawEdgeConnectionsResponse>(template);
      return { edgeType, bindings: data.results?.bindings || [] };
    },
  );

  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const { edgeType, bindings } of results) {
    for (const binding of bindings) {
      const sourceType = binding.sourceType?.value;
      const targetType = binding.targetType?.value;
      if (!sourceType || !targetType) {
        continue;
      }
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

  return { edgeConnections };
}
