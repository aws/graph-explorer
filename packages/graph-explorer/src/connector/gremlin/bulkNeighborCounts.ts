import { query } from "@/utils";
import {
  BulkNeighborCountRequest,
  BulkNeighborCountResponse,
  ErrorResponse,
} from "../useGEFetchTypes";
import { GInt64, GremlinFetch } from "./types";
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

export async function bulkNeighborCounts(
  gremlinFetch: GremlinFetch,
  request: BulkNeighborCountRequest
): Promise<BulkNeighborCountResponse> {
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
  const vertexMap = data.result.data["@value"][0];

  const map = parseGMap<GIdentifier, GNeighborCountsByType>(vertexMap);

  const counts = map
    .entries()
    .map(([key, value]) => {
      // Parse the g:Map in to a Map instance
      const countsByTypeMap = parseGMap<string, GInt64>(value);

      // Parse the Map entries in to the Record with vertex type as the key and the count as the value
      const countsByType = countsByTypeMap
        .entries()
        .map(([type, gValue]) => ({
          type,
          count: gValue["@value"],
        }))
        .reduce(
          (acc, curr) => {
            acc[curr.type] = curr.count;
            return acc;
          },
          {} as Record<string, number>
        );

      // Sum up all the type counts
      const totalCount = Object.values(countsByType).reduce(
        (acc, curr) => acc + curr,
        0
      );

      return {
        vertexId: createVertexId(extractRawId(key)),
        counts: countsByType,
        totalCount,
      };
    })
    .toArray();

  return { counts };
}
