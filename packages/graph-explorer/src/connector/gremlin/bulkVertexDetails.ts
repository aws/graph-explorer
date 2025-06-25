import { query } from "@/utils";
import {
  BulkVertexDetailsRequest,
  BulkVertexDetailsResponse,
  ErrorResponse,
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

export async function bulkVertexDetails(
  gremlinFetch: GremlinFetch,
  request: BulkVertexDetailsRequest
): Promise<BulkVertexDetailsResponse> {
  const ids = request.vertexIds.map(idParam).join(",");
  const template = query`
    g.V(${ids})
  `;

  // Fetch the vertex details
  const data = await gremlinFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const entities = mapResults(data.result.data);
  const vertices = entities.vertices;

  // Always false for vertexDetails query, even if the vertex has no properties
  vertices.forEach(vertex => (vertex.__isFragment = false));
  return { vertices };
}
