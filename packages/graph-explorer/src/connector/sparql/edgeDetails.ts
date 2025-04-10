import { createEdge } from "@/core";
import { EdgeDetailsRequest, EdgeDetailsResponse } from "../useGEFetchTypes";
import {
  SparqlFetch,
  sparqlResponseSchema,
  sparqlUriValueSchema,
} from "./types";
import { logger, query } from "@/utils";
import { z } from "zod";
import isErrorResponse from "../utils/isErrorResponse";
import { idParam } from "./idParam";
import { parseEdgeId } from "./parseEdgeId";

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
  const { source, target, predicate } = parseEdgeId(request.edgeId);

  const sourceIdTemplate = idParam(source);
  const targetIdTemplate = idParam(target);

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
    logger.warn("Edge not found", request.edgeId, response);
    return { edge: null };
  }

  const sourceTypes = parsed.data.results.bindings
    .filter(binding => binding.resource.value === source)
    .map(binding => binding.type.value);
  const targetTypes = parsed.data.results.bindings
    .filter(binding => binding.resource.value === target)
    .map(binding => binding.type.value);

  if (!sourceTypes.length || !targetTypes.length) {
    throw new Error("Edge type not found in bindings");
  }

  const edge = createEdge({
    id: request.edgeId,
    type: predicate,
    source: {
      id: source,
      types: sourceTypes,
    },
    target: {
      id: target,
      types: targetTypes,
    },
    // Ensure this edge is not a fragment since SPARQL edges can not have attributes
    attributes: {},
  });
  return { edge };
}
