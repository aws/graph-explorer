import { Edge } from "@/core";
import { EdgeDetailsRequest, EdgeDetailsResponse } from "../useGEFetchTypes";
import {
  parseEdgeId,
  SparqlFetch,
  sparqlResponseSchema,
  sparqlUriValueSchema,
} from "./types";
import { logger, query } from "@/utils";
import { z } from "zod";
import isErrorResponse from "../utils/isErrorResponse";

const responseSchema = sparqlResponseSchema(
  z.object({
    resource: sparqlUriValueSchema,
    type: sparqlUriValueSchema,
  })
);

export async function edgeDetails(
  sparqlFetch: SparqlFetch,
  request: EdgeDetailsRequest
): Promise<EdgeDetailsResponse> {
  const { source, target, predicate } = parseEdgeId(request.edge.id);

  const sourceIdTemplate = `<${source}>`;
  const targetIdTemplate = `<${target}>`;

  const template = query`
    # Get the resource types of source and target
    SELECT ?resource ?type
    WHERE {
      {
        VALUES ?resource { ${sourceIdTemplate} ${targetIdTemplate} }
        ?resource a ?type
      }
    }
  `;

  // Fetch the edge details
  const response = await sparqlFetch(template);
  if (isErrorResponse(response)) {
    logger.error("Edge details request failed", request, response);
    throw new Error("Vertex details request failed", {
      cause: response,
    });
  }

  // Parse the response
  const parsed = responseSchema.safeParse(response);

  if (!parsed.success) {
    logger.error(
      "Failed to parse sparql response",
      response,
      parsed.error.issues
    );
    throw new Error("Failed to parse sparql response", {
      cause: parsed.error,
    });
  }

  // Map the results
  if (parsed.data.results.bindings.length === 0) {
    logger.warn("Edge not found", request.edge, response);
    return { edge: null };
  }

  const sourceType = parsed.data.results.bindings.find(
    binding => binding.resource.value === source
  )?.type.value;
  const targetType = parsed.data.results.bindings.find(
    binding => binding.resource.value === target
  )?.type.value;

  if (!sourceType || !targetType) {
    throw new Error("Edge type not found in bindings");
  }

  const edge = <Edge>{
    entityType: "edge",
    id: request.edge.id,
    idType: "string",
    type: predicate,
    source: source,
    sourceType,
    target: target,
    targetType,
    attributes: {},
  };
  return { edge };
}
