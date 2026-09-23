import type {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  ErrorResponse,
} from "@/connector";

import isErrorResponse from "@/connector/utils/isErrorResponse";
import { warnMissingIds } from "@/connector/utils/warnMissingIds";
import { createEdge } from "@/core";
import { logger, query } from "@/utils";

import type { OCEdge, OpenCypherFetch } from "./types";

import { fragment } from "./fragments";
import mapApiEdge from "./mappers/mapApiEdge";

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

  const ids = request.edgeIds.map(fragment.id).join(",");
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
  warnMissingIds(
    "edges",
    request.edgeIds,
    edges.map(e => e.id),
    { data },
  );

  return { edges };
}
