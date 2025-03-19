import {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
  ErrorResponse,
} from "@/connector/useGEFetchTypes";
import { OCEdge, OpenCypherFetch } from "./types";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import { logger, query } from "@/utils";
import mapApiEdge from "./mappers/mapApiEdge";
import { idParam } from "./idParam";

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
  req: EdgeDetailsRequest
): Promise<EdgeDetailsResponse> {
  const template = query`
    MATCH ()-[edge]-()
    WHERE ID(edge) = ${idParam(req.edgeId)}
    RETURN edge, labels(startNode(edge)) as sourceLabels, labels(endNode(edge)) as targetLabels
  `;
  const data = await openCypherFetch<Response | ErrorResponse>(template);

  if (isErrorResponse(data)) {
    logger.error(
      "Failed to fetch edge details",
      req.edgeId,
      data.detailedMessage
    );
    throw new Error(data.detailedMessage);
  }

  const value = data.results[0];

  if (!value) {
    console.warn("Edge not found", req.edgeId);
    return { edge: null };
  }

  const sourceLabels = value.sourceLabels;
  const targetLabels = value.targetLabels;

  const edge = mapApiEdge(value.edge, sourceLabels, targetLabels);

  return { edge };
}
