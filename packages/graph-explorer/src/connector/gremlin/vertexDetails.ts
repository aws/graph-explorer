import { warnMissingIds } from "@/connector/utils/warnMissingIds";
import { createVertex } from "@/core";
import { query } from "@/utils";

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
  warnMissingIds(
    "vertices",
    request.vertexIds,
    vertices.map(v => v.id),
    {
      data,
    },
  );

  return { vertices };
}
