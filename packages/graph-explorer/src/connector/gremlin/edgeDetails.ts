import { logger, query } from "@/utils";
import {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  ErrorResponse,
} from "../useGEFetchTypes";
import { GEdge, GremlinFetch } from "./types";
import { mapResults } from "./mappers/mapResults";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";

type Response = {
  requestId: string;
  status: {
    message: string;
    code: number;
  };
  result: {
    data: {
      "@type": "g:List";
      "@value": Array<GEdge>;
    };
  };
};

export async function edgeDetails(
  gremlinFetch: GremlinFetch,
  request: EdgeDetailsRequest
): Promise<EdgeDetailsResponse> {
  // Bail early if request is empty
  if (!request.edgeIds.length) {
    return { edges: [] };
  }

  const ids = request.edgeIds.map(idParam).join(",");
  const template = query`
    g.E(${ids})
  `;

  // Fetch the vertex details
  const data = await gremlinFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const entities = mapResults(data.result.data);
  const edges = entities.edges;

  // Log a warning if some edges are missing
  const missing = new Set(request.edgeIds).difference(
    new Set(edges.map(e => e.id))
  );
  if (missing.size) {
    logger.warn("Did not find all requested edges", {
      requested: request.edgeIds,
      missing: missing.values().toArray(),
      data,
    });
  }

  // Always false for edgeDetails query, even if the edge has no properties
  edges.forEach(edge => (edge.__isFragment = false));
  return { edges };
}
