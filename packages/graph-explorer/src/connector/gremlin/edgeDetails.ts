import { createEdge } from "@/core";
import { logger, query } from "@/utils";

import type {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  ErrorResponse,
} from "../useGEFetchTypes";
import type { GEdge, GremlinFetch } from "./types";

import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";
import { mapResults } from "./mappers/mapResults";

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
  request: EdgeDetailsRequest,
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
  const edges = entities.filter(e => e.entityType === "edge").map(createEdge);

  // Log a warning if some edges are missing
  const missing = new Set(request.edgeIds).difference(
    new Set(edges.map(e => e.id)),
  );
  if (missing.size) {
    logger.warn("Did not find all requested edges", {
      requested: request.edgeIds,
      missing: missing.values().toArray(),
      data,
    });
  }

  return { edges };
}
