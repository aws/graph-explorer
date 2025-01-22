import {
  EdgeDetailsRequest,
  EdgeDetailsResponse,
} from "@/connector/useGEFetchTypes";
import { ocEdgeSchema, ocResponseSchema, OpenCypherFetch } from "./types";
import isErrorResponse from "@/connector/utils/isErrorResponse";
import { logger, query } from "@/utils";
import mapApiEdge from "./mappers/mapApiEdge";
import { z } from "zod";

const responseSchema = ocResponseSchema(
  z.object({
    edge: ocEdgeSchema,
    sourceLabels: z.array(z.string()),
    targetLabels: z.array(z.string()),
  })
);

export async function edgeDetails(
  openCypherFetch: OpenCypherFetch,
  req: EdgeDetailsRequest
): Promise<EdgeDetailsResponse> {
  const template = query`
    MATCH ()-[edge]-()
    WHERE ID(edge) = "${String(req.edge.id)}" 
    RETURN edge, labels(startNode(edge)) as sourceLabels, labels(endNode(edge)) as targetLabels
  `;
  const data = await openCypherFetch(template);

  if (isErrorResponse(data)) {
    logger.error(
      "Failed to fetch edge details",
      req.edge,
      data.detailedMessage
    );
    throw new Error(data.detailedMessage);
  }

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

  const value = parsed.data.results[0];

  if (!value) {
    console.warn("Edge not found", req.edge);
    return { edge: null };
  }

  const sourceLabels = value.sourceLabels.join("::");
  const targetLabels = value.targetLabels.join("::");

  const edge = mapApiEdge(value.edge, sourceLabels, targetLabels);

  return { edge };
}
