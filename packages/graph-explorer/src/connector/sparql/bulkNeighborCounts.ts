import { logger, query } from "@/utils";
import {
  BulkNeighborCountRequest,
  BulkNeighborCountResponse,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import {
  SparqlFetch,
  sparqlResponseSchema,
  sparqlUriValueSchema,
  sparqlValueSchema,
} from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "../utils/isErrorResponse";
import { z } from "zod";
import { createVertexId, VertexId } from "@/core";

const bindingSchema = z.object({
  resource: sparqlUriValueSchema,
  class: sparqlUriValueSchema,
  count: sparqlValueSchema,
});
const responseSchema = sparqlResponseSchema(bindingSchema);

export async function bulkNeighborCounts(
  sparqlFetch: SparqlFetch,
  request: BulkNeighborCountRequest
): Promise<BulkNeighborCountResponse> {
  const template = query`
    # Count neighbors by class which are related with the given subject URI
    SELECT ?resource ?class (COUNT(?neighbor) as ?count) {
      SELECT DISTINCT ?resource ?class ?neighbor
      WHERE {
        VALUES ?resource {
          ${request.vertexIds.map(idParam).join("\n")}
        }

        {
          # Incoming neighbors
          ?neighbor ?pIncoming ?resource . 
        }
        UNION
        {
          # Outgoing neighbors
          ?resource ?pOutgoing ?neighbor . 
        }

        ?neighbor a ?class .

        # Remove any classes from the list of neighbors
        FILTER NOT EXISTS {
          ?anySubject a ?neighbor .
        }
      }
    }
    GROUP BY ?resource ?class
  `;

  // Fetch the vertex details
  const response = await sparqlFetch(template);
  if (isErrorResponse(response)) {
    logger.error("Neighbor count request failed", request, response);
    throw new Error("Neighbor count request failed", {
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

  // Add empty values for all request IDs
  const groupedResults = new Map<VertexId, NeighborCountsResponse>();
  for (const id of request.vertexIds) {
    groupedResults.set(id, {
      vertexId: id,
      counts: {},
      totalCount: 0,
    });
  }

  // Map the results
  for (const binding of parsed.data.results.bindings) {
    const vertexId = createVertexId(binding.resource.value);
    const type = binding.class.value;
    const count = parseInt(binding.count.value);

    const existing = groupedResults.get(vertexId);

    if (existing) {
      // update existing
      existing.counts[type] = count;
      existing.totalCount += count;
    } else {
      // create new entry
      groupedResults.set(vertexId, {
        vertexId,
        counts: { [type]: count },
        totalCount: count,
      });
    }
  }

  return { counts: Array.from(groupedResults.values()) };
}
