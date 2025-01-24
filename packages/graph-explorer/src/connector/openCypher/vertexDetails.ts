import {
  ErrorResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "@/connector/useGEFetchTypes";
import { OCVertex, OpenCypherFetch } from "./types";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiVertex from "./mappers/mapApiVertex";
import { query } from "@/utils";

type Response = {
  results: [
    {
      vertex: OCVertex;
    },
  ];
};

export async function vertexDetails(
  openCypherFetch: OpenCypherFetch,
  req: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  const idTemplate = `"${String(req.vertex.id)}"`;
  const template = query`
    MATCH (vertex) WHERE ID(vertex) = ${idTemplate} RETURN vertex
  `;

  // Fetch the vertex details
  const data = await openCypherFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const ocVertex = data.results[0]?.vertex;

  if (!ocVertex) {
    console.warn("Vertex not found", req.vertex);
    return { vertex: null };
  }

  const vertex = mapApiVertex(ocVertex);
  return { vertex };
}
