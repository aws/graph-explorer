import { type NeighborsResponse } from "@/connector/useGEFetchTypes";
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

  // Filter out the source vertex since it is already in the graph and this one is missing the attributes
  const verticesMap = new Map(
    results.vertices
      .values()
      .filter(v => v.id !== req.resourceURI)
      .map(v => [v.id, createVertex(v)])
  );
  const edges = results.edges.map(e => createEdge(e));

  // Find any missing vertices from the edges and add them to the vertex array
  for (const vertexId of results.edges.flatMap(e => [e.sourceId, e.targetId])) {
    if (verticesMap.has(vertexId) || req.resourceURI === vertexId) {
      continue;
    }
    verticesMap.set(vertexId, createVertex({ id: vertexId }));
  }

  return { vertices: verticesMap.values().toArray(), edges };
}
