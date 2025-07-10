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
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { vertices: [] };
  }

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
