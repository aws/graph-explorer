import { createVertex } from "@/core";
import { logger, query, setDifference } from "@/utils";

import type {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import type { OpenCypherFetch } from "./types";

import isErrorResponse from "../utils/isErrorResponse";
import { fragment } from "./fragments";
import { mapResults } from "./mappers/mapResults";

export async function vertexDetails(
  openCypherFetch: OpenCypherFetch,
  request: VertexDetailsRequest,
): Promise<VertexDetailsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { vertices: [] };
  }

  const ids = request.vertexIds.map(fragment.id).join(",");
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
  const entities = mapResults(data);
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
