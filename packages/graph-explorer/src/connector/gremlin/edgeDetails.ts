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
  const template = query`
    g.E(${idParam(request.edge.id)})
  `;

  // Fetch the vertex details
  const data = await gremlinFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const entities = mapResults(data.result.data);
  const edge = entities.edges.length > 0 ? entities.edges[0] : null;
  if (!edge) {
    logger.warn("Edge not found", request.edge);
  }

  return { edge };
}
