import {
  ErrorResponse,
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "@/connector/useGEFetchTypes";
import { OCVertex, OpenCypherFetch } from "./types";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiVertex from "./mappers/mapApiVertex";
import { query } from "@/utils";
import { idParam } from "./idParam";

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
  const template = query`
    MATCH (vertex) WHERE ID(vertex) = ${idParam(req.vertexId)} RETURN vertex
  `;

  // Fetch the vertex details
  const data = await openCypherFetch<Response | ErrorResponse>(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Map the results
  const ocVertex = data.results[0]?.vertex;

  if (!ocVertex) {
    console.warn("Vertex not found", req.vertexId);
    return { vertex: null };
  }

  const vertex = mapApiVertex(ocVertex);
  return { vertex };
}
