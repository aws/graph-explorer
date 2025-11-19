import { logger, query } from "@/utils";
import type {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  ErrorResponse,
} from "@/connector";
import type { OCEdge, OpenCypherFetch } from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiEdge from "./mappers/mapApiEdge";
import { createEdge } from "@/core";

type Response = {
  results: [
    {
      edge: OCEdge;
    },
  ];
};

export async function edgeDetails(
  openCypherFetch: OpenCypherFetch,
  request: EdgeDetailsRequest,
): Promise<EdgeDetailsResponse> {
  // Bail early if request is empty
  if (!request.edgeIds.length) {
    return { edges: [] };
  }

  const ids = request.edgeIds.map(idParam).join(",");
  const template = query`
    MATCH ()-[edge]-()
    WHERE ID(edge) in [${ids}]
    RETURN edge
  `;
  const data = await openCypherFetch<Response | ErrorResponse>(template);

  if (isErrorResponse(data)) {
    logger.error(
      "Failed to fetch edge details",
      request.edgeIds,
      data.detailedMessage,
    );
    throw new Error(data.detailedMessage);
  }

  const edges = data.results
    .map(result => mapApiEdge(result.edge))
    .map(createEdge);

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
