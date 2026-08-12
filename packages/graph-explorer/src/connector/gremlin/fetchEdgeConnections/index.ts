import type {
  EdgeConnectionsRequest,
  EdgeConnectionsResponse,
} from "@/connector/useGEFetchTypes";

import { createEdgeType, createVertexType, type EdgeConnection } from "@/core";
import { DEFAULT_CONCURRENT_REQUESTS_LIMIT } from "@/utils/constants";
import mapWithConcurrency from "@/utils/mapWithConcurrency";

import type { GMapWithValue, GremlinFetch } from "../types";

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
      "@value": Array<GMapWithValue<string, string>>;
    };
  };
};

export default async function fetchEdgeConnections(
  gremlinFetch: GremlinFetch,
  req: EdgeConnectionsRequest,
): Promise<EdgeConnectionsResponse> {
  const results = await mapWithConcurrency(
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
      const map = parseGMap(item);
      const sourceValue = map.get("sourceType");
      const targetValue = map.get("targetType");

      if (!sourceValue || !targetValue) {
        continue;
      }

      const sourceTypes = splitLabel(sourceValue);
      const targetTypes = splitLabel(targetValue);

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
