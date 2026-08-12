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

import type { OpenCypherFetch } from "../types";

import edgeConnectionsTemplate from "./edgeConnectionsTemplate";

type RawEdgeConnectionsResponse = {
  results: Array<{
    edgeType: string;
    sourceLabels: string[];
    targetLabels: string[];
  }>;
};

export default async function fetchEdgeConnections(
  openCypherFetch: OpenCypherFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const batches = chunk(req.edgeTypes, DEFAULT_BATCH_REQUEST_SIZE);
  const responses = await mapWithConcurrency(
    batches,
    DEFAULT_CONCURRENT_REQUESTS_LIMIT,
    batch =>
      openCypherFetch<RawEdgeConnectionsResponse>(
        edgeConnectionsTemplate({ types: batch }),
      ),
  );

  const seen = new Set<string>();
  const edgeConnections: EdgeConnection[] = [];

  for (const data of responses) {
    for (const item of data.results ?? []) {
      const edgeType = item.edgeType;
      // The response type is an unchecked assertion on the fetch (no Zod at this
      // boundary), so guard the field rather than trust the declared contract.
      if (!edgeType) {
        continue;
      }
      const sourceLabels = item.sourceLabels ?? [];
      const targetLabels = item.targetLabels ?? [];

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
