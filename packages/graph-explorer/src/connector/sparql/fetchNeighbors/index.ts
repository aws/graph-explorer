import type { NeighborsResponse } from "@/connector/useGEFetchTypes";
import { oneHopNeighborsTemplate } from "./oneHopNeighborsTemplate";
import { SparqlFetch, SPARQLNeighborsRequest } from "../types";
import { logger } from "@/utils";
import { createEdge, createVertex } from "@/core";
import { parseAndMapQuads } from "../parseAndMapQuads";

/**
 * Given a subject URI, it returns a set of subjects (with their properties)
 * which are directly connected.
 * We differentiate two types of neighbors:
 * - outgoing neighbors, which are neighbors that are reached using
 *   the given subject as starting point (<subject_uri> ?pred ?outgoingSubject)
 * - incoming neighbors, which are neighbors can reach the given
 *   subject (?incomingSubject ?pred <subject_uri>)
 *
 * It also, perform a query for each neighbors to know
 * how many subjects are connected to it.
 *
 * It does not return neighbors counts.
 */
export default async function fetchNeighbors(
  sparqlFetch: SparqlFetch,
  req: SPARQLNeighborsRequest
): Promise<NeighborsResponse> {
  // Fetch vertex details
  const oneHopTemplate = oneHopNeighborsTemplate(req);
  logger.log("[SPARQL Explorer] Fetching oneHopNeighbors...", req);
  const data = await sparqlFetch(oneHopTemplate);

  // Map to fully materialized entities
  const results = parseAndMapQuads(data);

  // Seed the vertex map with the ResultVertex instances in the response
  const verticesMap = new Map(
    results.vertices.values().map(v => [v.id, createVertex(v)])
  );

  // Find any missing vertices from the edges and add them to the vertex array
  results.edges
    .values()
    .flatMap(e => [e.sourceId, e.targetId])
    .filter(id => !verticesMap.has(id))
    .forEach(id => {
      verticesMap.set(id, createVertex({ id: id }));
    });

  // Filter out the source vertex since it is already in the graph and this one is missing the attributes
  const vertices = Array.from(
    verticesMap.values().filter(v => v.id !== req.resourceURI)
  );

  // Create edges from the ResultEdge instances in the response
  const edges = results.edges.map(e => createEdge(e));

  return { vertices, edges };
}
