import { logger, query } from "@/utils";
import {
  ErrorResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import { GremlinFetch, GVertex } from "./types";
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
      "@value": Array<GVertex>;
    };
  };
};

export async function vertexDetails(
  gremlinFetch: GremlinFetch,
  request: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  const template = query`
    g.V(${idParam(request.vertex)})
  `;

  // Fetch the vertex details
  const data = await gremlinFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const entities = mapResults(data.result.data);
  const vertex = entities.vertices.length > 0 ? entities.vertices[0] : null;
  if (!vertex) {
    logger.warn("Vertex not found", request.vertex);
  }

  return { vertex };
}
