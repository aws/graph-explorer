import { createVertex } from "@/core";
import { logger, query, setDifference } from "@/utils";

import type {
  ErrorResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import type { GremlinFetch, GVertex } from "./types";

import isErrorResponse from "../utils/isErrorResponse";
import { fragment } from "./fragments";
import { mapResults } from "./mappers/mapResults";

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
  request: VertexDetailsRequest,
): Promise<VertexDetailsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { vertices: [] };
  }

  const ids = request.vertexIds.map(fragment.id).join(",");
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
  const vertices = entities
    .filter(e => e.entityType === "vertex")
    .map(v => createVertex(v));

  // Log a warning if some nodes are missing
  const foundVertexIds = new Set(vertices.map(v => v.id));
  const missing = setDifference(new Set(request.vertexIds), foundVertexIds);
  if (missing.size) {
    logger.warn("Did not find all requested vertices", {
      requested: request.vertexIds,
      missing: Array.from(missing.values()),
      data,
    });
  }

  return { vertices };
}
