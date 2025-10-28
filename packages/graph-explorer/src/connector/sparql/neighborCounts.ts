import { LABELS, logger, query } from "@/utils";
import type {
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import {
  type BlankNodeItem,
  type BlankNodesMap,
  type SparqlFetch,
  sparqlNumberValueSchema,
  sparqlResourceValueSchema,
  sparqlResponseSchema,
  sparqlUriValueSchema,
} from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "../utils/isErrorResponse";
import { z } from "zod";
import { fromError } from "zod-validation-error/v3";
import { createVertexId, type VertexId } from "@/core";
import fetchBlankNodeNeighbors from "./fetchBlankNodeNeighbors";
import { getNeighborsFilter } from "./filterHelpers";

export async function neighborCounts(
  sparqlFetch: SparqlFetch,
  request: NeighborCountsRequest,
  blankNodes: BlankNodesMap
): Promise<NeighborCountsResponse> {
  // Bail early if request is empty
  if (!request.vertexIds.length) {
    return { counts: [] };
  }

  const blankNodeVertexIds: VertexId[] = [];
  const resouceVertexIds: VertexId[] = [];

  for (const id of request.vertexIds) {
    if (blankNodes.has(id)) {
      blankNodeVertexIds.push(id);
    } else {
      resouceVertexIds.push(id);
    }
  }

  const [blankNodeResponses, resourceResponses] = await Promise.all([
    fetchBlankNodeNeighborCounts(sparqlFetch, blankNodeVertexIds, blankNodes),
    fetchNeighborCounts(sparqlFetch, resouceVertexIds),
  ]);

  return {
    counts: [...blankNodeResponses.counts, ...resourceResponses.counts],
  };
}

async function fetchNeighborCounts(
  sparqlFetch: SparqlFetch,
  vertexIds: VertexId[]
): Promise<NeighborCountsResponse> {
  if (!vertexIds.length) {
    return { counts: [] };
  }

  const [totalCounts, countsByType] = await Promise.all([
    fetchUniqueNeighborCount(sparqlFetch, vertexIds),
    fetchCountsByType(sparqlFetch, vertexIds),
  ]);

  // Add empty values for all request IDs
  const results = new Array<NeighborCount>();
  for (const id of vertexIds) {
    const totalCount = totalCounts.get(id) ?? 0;
    const counts = countsByType.get(id) ?? {};
    results.push({
      vertexId: id,
      counts,
      totalCount,
    });
  }

  return { counts: results };
}

/**
 * Queries for the total unique neighbors which are related with the given subject URI.
 */
async function fetchUniqueNeighborCount(
  sparqlFetch: SparqlFetch,
  resources: VertexId[]
) {
  const template = query`
    # Count total unique neighbors which are related with the given subject URI
    SELECT ?resource (COUNT(DISTINCT ?neighbor) AS ?totalCount)
    WHERE {
      VALUES ?resource { 
        ${resources.map(idParam).join("\n")}
      }
      {
        ?resource ?predicate ?neighbor .
        ${getNeighborsFilter()}
      }
      UNION
      {
        ?neighbor ?predicate ?resource .
        ${getNeighborsFilter()}
      }
    }
    GROUP BY ?resource
  `;

  // Execute the query
  const response = await sparqlFetch(template);
  if (isErrorResponse(response)) {
    logger.error("Total neighbor count request failed", resources, response);
    throw new Error("Total neighbor count request failed", {
      cause: response,
    });
  }

  // Parse the response
  const responseSchema = sparqlResponseSchema(
    z.object({
      resource: sparqlResourceValueSchema,
      totalCount: sparqlNumberValueSchema,
    })
  );
  const parsed = responseSchema.safeParse(response);

  if (!parsed.success) {
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse sparql response for totalCount",
      validationError.toString(),
      response
    );
    throw validationError;
  }

  // Map to the result
  const result: Map<VertexId, number> = new Map();
  for (const binding of parsed.data.results.bindings) {
    const vertexId = createVertexId(binding.resource.value);
    const count = parseInt(binding.totalCount.value);
    result.set(vertexId, count);
  }

  return result;
}

/**
 * Queries for the total unique neighbors grouped by class which are related
 * with the given subject URI.
 *
 * This count might be higher than the total unique neighbors count because some
 * neighbors may have more than one associated type.
 */
async function fetchCountsByType(
  sparqlFetch: SparqlFetch,
  resources: VertexId[]
) {
  const template = query`
    # Count neighbors by class which are related with the given subject URI
    SELECT ?resource ?type (COUNT(DISTINCT ?neighbor) AS ?typeCount)
    WHERE {
      VALUES ?resource { 
        ${resources.map(idParam).join("\n")}
      }
      {
        ?resource ?predicate ?neighbor .
        OPTIONAL { ?neighbor a ?type } .
        ${getNeighborsFilter()}
      }
      UNION
      {
        ?neighbor ?predicate ?resource .
        OPTIONAL { ?neighbor a ?type } .
        ${getNeighborsFilter()}
      }
    }
    GROUP BY ?resource ?type
  `;

  // Execute the query
  const response = await sparqlFetch(template);
  if (isErrorResponse(response)) {
    logger.error("Total neighbor count request failed", resources, response);
    throw new Error("Total neighbor count request failed", {
      cause: response,
    });
  }

  // Parse the response
  const responseSchema = sparqlResponseSchema(
    z.object({
      resource: sparqlUriValueSchema,
      type: sparqlUriValueSchema.optional(),
      typeCount: sparqlNumberValueSchema,
    })
  );
  const parsed = responseSchema.safeParse(response);

  if (!parsed.success) {
    const validationError = fromError(parsed.error);
    logger.error(
      "Failed to parse sparql response for totalCount",
      validationError.toString(),
      response
    );
    throw validationError;
  }

  // Map to the result
  return parsed.data.results.bindings.reduce((mappedResults, binding) => {
    //Map the binding to useful values
    const vertexId = createVertexId(binding.resource.value);
    const type = binding.type?.value ?? LABELS.MISSING_TYPE;
    const count = parseInt(binding.typeCount.value);

    // Get the existing entry if it exists
    const existing = mappedResults.get(vertexId) ?? {};

    // Merge new type count in to existing entry
    return mappedResults.set(vertexId, {
      ...existing,
      [type]: count,
    });
  }, new Map<VertexId, Record<string, number>>());
}

async function fetchBlankNodeNeighborCounts(
  sparqlFetch: SparqlFetch,
  vertexIds: VertexId[],
  blankNodes: BlankNodesMap
) {
  const counts: NeighborCount[] = [];
  const missing: Map<VertexId, BlankNodeItem> = new Map();

  // Find cached and missing blank node neighbor counts
  for (const vertexId of vertexIds) {
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
