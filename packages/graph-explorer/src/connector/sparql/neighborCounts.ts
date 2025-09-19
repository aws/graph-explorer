import { logger, query } from "@/utils";
import {
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
} from "../useGEFetchTypes";
import {
  BlankNodeItem,
  BlankNodesMap,
  rdfTypeUri,
  SparqlFetch,
  sparqlNumberValueSchema,
  sparqlResourceValueSchema,
  sparqlResponseSchema,
  sparqlUriValueSchema,
} from "./types";
import { idParam } from "./idParam";
import isErrorResponse from "../utils/isErrorResponse";
import { z } from "zod";
import { fromError } from "zod-validation-error/v3";
import { createVertexId, VertexId } from "@/core";
import fetchBlankNodeNeighbors from "./fetchBlankNodeNeighbors";

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

  const [totalCounts, countsByType] = await Promise.all([
    fetchUniqueNeighborCount(sparqlFetch, nonBlankNodeVertexIds),
    fetchCountsByType(sparqlFetch, nonBlankNodeVertexIds),
  ]);

  // Add empty values for all request IDs
  const results = new Array<NeighborCount>();
  for (const id of request.vertexIds) {
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
        ?resource ?p ?neighbor .
        ?neighbor a [] .
        FILTER(
          ?p != ${idParam(rdfTypeUri)} &&
          !isLiteral(?neighbor)
        )
      }
      UNION
      {
        ?neighbor ?p ?resource .
        ?neighbor a [] .
        FILTER(
          ?p != ${idParam(rdfTypeUri)} &&
          !isLiteral(?neighbor)
        )
      }
    }
    GROUP BY ?resource
  `;

  // Fetch the vertex details
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
        ?resource ?p ?neighbor .
        ?neighbor a ?type .
        FILTER(
          ?p != ${idParam(rdfTypeUri)} &&
          !isLiteral(?neighbor)
        )
      }
      UNION
      {
        ?neighbor ?p ?resource .
        ?neighbor a ?type .
        FILTER(
          ?p != ${idParam(rdfTypeUri)} &&
          !isLiteral(?neighbor)
        )
      }
    }
    GROUP BY ?resource ?type
  `;

  // Fetch the vertex details
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
      type: sparqlUriValueSchema,
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
  return new Map(
    parsed.data.results.bindings.reduce((acc, binding) => {
      const vertexId = createVertexId(binding.resource.value);
      const existing = acc.get(vertexId) ?? {};
      return acc.set(vertexId, {
        ...existing,
        [binding.type.value]: parseInt(binding.typeCount.value),
      });
    }, new Map<VertexId, Record<string, number>>())
  );
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
