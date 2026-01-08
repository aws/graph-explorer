import { query } from "@/utils";
import type {
  ErrorResponse,
  NeighborCountsRequest,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import type { GInt64, GremlinFetch } from "./types";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";
import { createVertexId } from "@/core";
import { extractRawId } from "./mappers/extractRawId";
import { parseGMap } from "./mappers/parseGMap";

type GIdentifier = string | GInt64;

type GNeighborCountsByType = {
  "@type": "g:Map";
  "@value": Array<string | GInt64>;
};

type Response = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<{
        "@type": "g:Map";
        "@value": (GIdentifier | GNeighborCountsByType)[];
      }>;
    };
  };
};

export async function neighborCounts(
  gremlinFetch: GremlinFetch,
  request: NeighborCountsRequest,
): Promise<NeighborCountsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { counts: [] };
  }

  const ids = request.vertexIds.map(idParam).join(",");
  const template = query`
    g.V(${ids})
     .group()
     .by(id)
     .by(
       both().dedup().group().by(label).by(count())
     )
  `;

  // Fetch the vertex details
  const data = await gremlinFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const valueMap = data.result.data["@value"][0];
  if (!valueMap) {
    return { counts: [] };
  }

  const map = parseGMap<GIdentifier, GNeighborCountsByType>(valueMap);

  const counts = map
    .entries()
    .map(([key, value]) => {
      // Parse the g:Map in to a Map instance
      const countsByTypeMap = parseGMap<string, GInt64>(value);

      // Parse the Map entries in to a Map with vertex type as the key and the count as the value
      const countsByType = new Map<string, number>();
      let totalCount = 0;

      for (const [type, gValue] of countsByTypeMap.entries()) {
        const count = gValue["@value"];
        totalCount += count;
        const types = type.split("::");
        for (const t of types) {
          countsByType.set(t, (countsByType.get(t) ?? 0) + count);
        }
      }

      return {
        vertexId: createVertexId(extractRawId(key)),
        counts: countsByType,
        totalCount,
      };
    })
    .toArray();

  return { counts };
}
