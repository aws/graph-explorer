import { logger, query } from "@/utils";
import { EdgeDetailsRequest, EdgeDetailsResponse } from "../useGEFetchTypes";
import {
  sparqlResponseSchema,
  SparqlFetch,
  sparqlUriValueSchema,
} from "./types";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { createEdge, Edge } from "@/core";
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
  // Bail early if request is empty
  if (!request.edgeIds.length) {
    return { edges: [] };
  }

  const parsedEdges = request.edgeIds.map(edgeId => ({
    edgeId,
    ...parseEdgeId(edgeId),
  }));

  // Get the unique resources
  const resources = new Set(
    parsedEdges.flatMap(({ source, target }) => [source, target])
  )
    .values()
    .map(idParam)
    .toArray()
    .join("\n");
  const template = query`
    # Get the resource types of source and target
    SELECT ?resource ?type
    WHERE {
      {
        VALUES ?resource { 
          ${resources} 
        }
        ?resource a ?type
      }
    }
  `;

  // Fetch the edge details
  const response = await sparqlFetch(template);
  if (isErrorResponse(response)) {
    logger.error("Edge details request failed", request, response);
    throw new Error("Edge details request failed", {
      cause: response,
    });
  }

  // Parse the response
  const parsed = responseSchema.safeParse(response);

  if (!parsed.success) {
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse sparql response",
      validationError.toString(),
      response
    );
    throw validationError;
  }

  // Map the results
  const edges: Edge[] = [];
  for (const { edgeId, predicate, source, target } of parsedEdges) {
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
      id: edgeId,
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
    edges.push(edge);
  }

  // Log a warning if some nodes are missing
  const missing = new Set(request.edgeIds).difference(
    new Set(edges.map(e => e.id))
  );
  if (missing.size) {
    logger.warn("Did not find all requested edges", {
      requested: request.edgeIds,
      missing: missing.values().toArray(),
      response,
    });
  }

  return { edges };
}
