import { logger, query } from "@/utils";
import {
  BulkEdgeDetailsRequest,
  BulkEdgeDetailsResponse,
} from "../useGEFetchTypes";
import {
  sparqlResponseSchema,
  SparqlFetch,
  sparqlUriValueSchema,
} from "./types";
import { z } from "zod";
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

export async function bulkEdgeDetails(
  sparqlFetch: SparqlFetch,
  request: BulkEdgeDetailsRequest
): Promise<BulkEdgeDetailsResponse> {
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
    # Get the resource types of source and target for all edges
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
    logger.error("Bulk edge details request failed", request, response);
    throw new Error("Bulk edge details request failed", {
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
    logger.warn("Edges not found", request.edgeIds, response);
    return { edges: [] };
  }

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

  return { edges };
}
