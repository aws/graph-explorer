import { query } from "@/utils";
import {
  ErrorResponse,
  NeighborCountsRequest,
  NeighborCountsResponse,
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

export async function neighborCounts(
  gremlinFetch: GremlinFetch,
  request: NeighborCountsRequest
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

      // Parse the Map entries in to the Record with vertex type as the key and the count as the value
      const countsByType = countsByTypeMap
        .entries()
        .map(([type, gValue]) => ({
          type,
          count: gValue["@value"],
        }))
        .reduce(
          (acc, curr) => {
            // TODO: In a future set of changes we should pass the full lsit of types
            // up to the UI so that it can list them out properly, but since this is a
            // rather large change I am defering that work.
            const type = curr.type.split("::")[0] ?? "";
            acc[type] = curr.count;
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
