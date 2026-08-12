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

import type { SparqlFetch } from "../types";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

type RawEdgeConnectionsResponse = {
  results: {
    bindings: Array<{
      edgeType: { type: string; value: string };
      sourceType: { type: string; value: string };
      targetType: { type: string; value: string };
    }>;
  };
};

export default async function fetchEdgeConnections(
  sparqlFetch: SparqlFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const batches = chunk(req.edgeTypes, DEFAULT_BATCH_REQUEST_SIZE);
  const responses = await mapWithConcurrency(
    batches,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    batch =>
      sparqlFetch<RawEdgeConnectionsResponse>(
        edgeConnectionsTemplate({ predicates: batch }),
      ),
  );

  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const data of responses) {
    for (const binding of data.results?.bindings ?? []) {
      const edgeType = binding.edgeType?.value;
      const sourceType = binding.sourceType?.value;
      const targetType = binding.targetType?.value;
      if (!edgeType || !sourceType || !targetType) {
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
