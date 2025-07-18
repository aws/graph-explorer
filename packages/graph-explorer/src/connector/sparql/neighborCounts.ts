import { logger, query } from "@/utils";
import {
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import {
  BlankNodeItem,
  BlankNodesMap,
  SparqlFetch,
  sparqlResponseSchema,
  sparqlUriValueSchema,
  sparqlValueSchema,
} from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "../utils/isErrorResponse";
import { z } from "zod";
import { fromError } from "zod-validation-error/v3";
import { createVertexId, VertexId } from "@/core";
import fetchBlankNodeNeighbors from "./fetchBlankNodeNeighbors";

const bindingSchema = z.object({
  resource: sparqlUriValueSchema,
  class: sparqlUriValueSchema,
  count: sparqlValueSchema,
});
const responseSchema = sparqlResponseSchema(bindingSchema);

export async function neighborCounts(
  sparqlFetch: SparqlFetch,
  request: NeighborCountsRequest,
  blankNodes: BlankNodesMap
): Promise<NeighborCountsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { counts: [] };
  }

  const blankNodeResponses = await fetchBlankNodeNeighborCounts(
    sparqlFetch,
    request,
    blankNodes
  );

  const nonBlankNodeResponses = await fetchNeighborCounts(
    sparqlFetch,
    request,
    blankNodes
  );

  return {
    counts: [...blankNodeResponses.counts, ...nonBlankNodeResponses.counts],
  };
}

async function fetchNeighborCounts(
  sparqlFetch: SparqlFetch,
  request: NeighborCountsRequest,
  blankNodes: BlankNodesMap
): Promise<NeighborCountsResponse> {
  const nonBlankNodeVertexIds = request.vertexIds.filter(
    id => !blankNodes.has(id)
  );

  if (!nonBlankNodeVertexIds.length) {
    return { counts: [] };
  }

  const template = query`
    # Count neighbors by class which are related with the given subject URI
    SELECT ?resource ?class (COUNT(?neighbor) as ?count) {
      SELECT DISTINCT ?resource ?class ?neighbor
      WHERE {
        VALUES ?resource {
          ${nonBlankNodeVertexIds.map(idParam).join("\n")}
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
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse sparql response",
      validationError.toString(),
      response
    );
    throw validationError;
  }

  // Add empty values for all request IDs
  const groupedResults = new Map<VertexId, NeighborCount>();
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

async function fetchBlankNodeNeighborCounts(
  sparqlFetch: SparqlFetch,
  request: NeighborCountsRequest,
  blankNodes: BlankNodesMap
) {
  const counts: NeighborCount[] = [];
  const missing: Map<VertexId, BlankNodeItem> = new Map();

  // Find cached and missing blank node neighbor counts
  for (const vertexId of request.vertexIds) {
    const bNode = blankNodes.get(vertexId);
    if (!bNode) {
      continue;
    }

    // the neighbors property will be undefined if the neighbors have not been fetched yet
    if (bNode.neighbors) {
      counts.push({
        vertexId,
        ...bNode.neighborCounts,
      });
    } else {
      missing.set(vertexId, bNode);
    }
  }

  if (!missing.size) {
    return { counts };
  }

  // Fetch any missing blank node neighbor counts
  const blankNodeResponses = await Promise.all(
    missing.entries().map(async ([vertexId, bNode]) => {
      const response = await fetchBlankNodeNeighbors(sparqlFetch, {
        resourceURI: bNode.vertex.id,
        resourceClasses: bNode.vertex.types,
        subQuery: bNode.subQueryTemplate,
      });

      return {
        ...response,
        bNode,
        vertexId,
      };
    })
  );

  for (const response of blankNodeResponses) {
    // Cache the neighbor counts
    blankNodes.set(response.vertexId, {
      ...response.bNode,
      neighborCounts: {
        totalCount: response.totalCount,
        counts: response.counts,
      },
      neighbors: response.neighbors,
    });

    // Add to the result set
    counts.push({
      vertexId: response.vertexId,
      totalCount: response.totalCount,
      counts: response.counts,
    });
  }

  return {
    counts: counts,
  };
}
