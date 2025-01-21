import { logger, query } from "@/utils";
import { EdgeDetailsRequest, EdgeDetailsResponse } from "../useGEFetchTypes";
import {
  gremlinEdgeSchema,
  GremlinFetch,
  gremlinListSchema,
  gremlinResponseSchema,
} from "./types";
import { mapResults } from "./mappers/mapResults";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";

const responseSchema = gremlinResponseSchema(
  gremlinListSchema(gremlinEdgeSchema)
);

export async function edgeDetails(
  gremlinFetch: GremlinFetch,
  request: EdgeDetailsRequest
): Promise<EdgeDetailsResponse> {
  const template = query`
    g.E(${idParam(request.edge)})
  `;

  // Fetch the vertex details
  const data = await gremlinFetch(template);
  if (isErrorResponse(data)) {
    logger.error(data.detailedMessage);
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
  const edge = entities.edges.length > 0 ? entities.edges[0] : null;
  if (!edge) {
    logger.warn("Edge not found", request.edge);
  }

  return { edge };
}
