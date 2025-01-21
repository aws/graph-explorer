import { logger, query } from "@/utils";
import {
  VertexDetailsRequest,
  VertexDetailsResponse,
} from "../useGEFetchTypes";
import {
  GremlinFetch,
  gremlinListSchema,
  gremlinResponseSchema,
  gremlinVertexSchema,
} from "./types";
import { mapResults } from "./mappers/mapResults";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";

const responseSchema = gremlinResponseSchema(
  gremlinListSchema(gremlinVertexSchema)
);

export async function vertexDetails(
  gremlinFetch: GremlinFetch,
  request: VertexDetailsRequest
): Promise<VertexDetailsResponse> {
  const template = query`
    g.V(${idParam(request.vertex)})
  `;

  // Fetch the vertex details
  const data = await gremlinFetch(template);
  if (isErrorResponse(data)) {
    throw new Error(data.detailedMessage);
  }

  // Parse the response
  const parsed = responseSchema.safeParse(data);

  if (!parsed.success) {
    logger.error("Failed to parse gremlin response", data, parsed.error.issues);
    throw new Error("Failed to parse gremlin response", {
      cause: parsed.error,
    });
  }

  // Map the results
  const entities = mapResults(parsed.data.result.data as any);
  const vertex = entities.vertices.length > 0 ? entities.vertices[0] : null;
  if (!vertex) {
    logger.warn("Vertex not found", request.vertex);
  }

  return { vertex };
}
