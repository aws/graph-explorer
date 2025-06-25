import { query } from "@/utils";
import {
  BulkVertexDetailsRequest,
  BulkVertexDetailsResponse,
} from "../useGEFetchTypes";
import { OpenCypherFetch } from "./types";
import { mapResults } from "./mappers/mapResults";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";

export async function bulkVertexDetails(
  openCypherFetch: OpenCypherFetch,
  request: BulkVertexDetailsRequest
): Promise<BulkVertexDetailsResponse> {
  const ids = request.vertexIds.map(idParam).join(",");
  const template = query`
    MATCH (vertex) 
    WHERE ID(vertex) in [${ids}] 
    RETURN vertex
  `;

  // Fetch the vertex details
  const data = await openCypherFetch(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const vertices = mapResults(data).vertices;

  // Always false for vertexDetails query, even if the vertex has no properties
  vertices.forEach(vertex => (vertex.__isFragment = false));

  return { vertices };
}
