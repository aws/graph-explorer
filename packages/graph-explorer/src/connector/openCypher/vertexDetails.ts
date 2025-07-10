import { logger, query } from "@/utils";
import {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import { OpenCypherFetch } from "./types";
import { mapResults } from "./mappers/mapResults";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";

export async function vertexDetails(
  openCypherFetch: OpenCypherFetch,
  request: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { vertices: [] };
  }

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

  // Log a warning if some nodes are missing
  const missing = new Set(request.vertexIds).difference(
    new Set(vertices.map(v => v.id))
  );
  if (missing.size) {
    logger.warn("Did not find all requested vertices", {
      requested: request.vertexIds,
      missing: missing.values().toArray(),
      data,
    });
  }

  // Always false for vertexDetails query, even if the vertex has no properties
  vertices.forEach(vertex => (vertex.__isFragment = false));

  return { vertices };
}
