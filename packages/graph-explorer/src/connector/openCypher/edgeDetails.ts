import { logger, query } from "@/utils";
import {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  ErrorResponse,
} from "@/connector";
import { OCEdge, OpenCypherFetch } from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiEdge from "./mappers/mapApiEdge";
import { mapValuesToQueryResults } from "../mapping";

type Response = {
  results: [
    {
      edge: OCEdge;
      sourceLabels: Array<string>;
      targetLabels: Array<string>;
    },
  ];
};

export async function edgeDetails(
  openCypherFetch: OpenCypherFetch,
  request: EdgeDetailsRequest
): Promise<EdgeDetailsResponse> {
  // Bail early if request is empty
  if (!request.edgeIds.length) {
    return { edges: [] };
  }

  const ids = request.edgeIds.map(idParam).join(",");
  const template = query`
    MATCH ()-[edge]-()
    WHERE ID(edge) in [${ids}]
    RETURN edge, labels(startNode(edge)) as sourceLabels, labels(endNode(edge)) as targetLabels
  `;
  const data = await openCypherFetch<Response | ErrorResponse>(template);

  if (isErrorResponse(data)) {
    logger.error(
      "Failed to fetch edge details",
      request.edgeIds,
      data.detailedMessage
    );
    throw new Error(data.detailedMessage);
  }

  const edges = mapValuesToQueryResults(
    data.results.map(result =>
      mapApiEdge(result.edge, result.sourceLabels, result.targetLabels)
    )
  ).edges;

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

  return { edges };
}
