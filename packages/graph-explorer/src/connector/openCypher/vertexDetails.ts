import {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "@/connector/useGEFetchTypes";
import { ocResponseSchema, ocVertexSchema, OpenCypherFetch } from "./types";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import mapApiVertex from "./mappers/mapApiVertex";
import { logger, query } from "@/utils";
import { z } from "zod";

const responseSchema = ocResponseSchema(
  z.object({
    vertex: ocVertexSchema,
  })
);

export async function vertexDetails(
  openCypherFetch: OpenCypherFetch,
  req: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  const idTemplate = `"${String(req.vertex.id)}"`;
  const template = query`
    MATCH (vertex) WHERE ID(vertex) = ${idTemplate} RETURN vertex
  `;

  // Fetch the vertex details
  const data = await openCypherFetch(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Parse the response
  const parsed = responseSchema.safeParse(data);

  if (!parsed.success) {
    logger.error(
      "Failed to parse openCypher response",
      data,
      parsed.error.issues
    );
    throw new Error("Failed to parse openCypher response", {
      cause: parsed.error,
    });
  }

  // Map the results
  const ocVertex = parsed.data.results[0]?.vertex;

  if (!ocVertex) {
    console.warn("Vertex not found", req.vertex);
    return { vertex: null };
  }

  const vertex = mapApiVertex(ocVertex);
  return { vertex };
}
