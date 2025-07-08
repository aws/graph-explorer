import { logger, query } from "@/utils";
import {
  BulkEdgeDetailsRequest,
  BulkEdgeDetailsResponse,
  ErrorResponse,
} from "../useGEFetchTypes";
import { OCEdge, OpenCypherFetch } from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "../utils/isErrorResponse";
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

export async function bulkEdgeDetails(
  openCypherFetch: OpenCypherFetch,
  request: BulkEdgeDetailsRequest
): Promise<BulkEdgeDetailsResponse> {
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

  if (!data.results.length) {
    logger.warn("Edges not found", request.edgeIds);
    return { edges: [] };
  }

  const edges = mapValuesToQueryResults(
    data.results.map(result => ({
      edge: mapApiEdge(result.edge, result.sourceLabels, result.targetLabels),
    }))
  ).edges;

  return { edges };
}
