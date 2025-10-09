import { type NeighborsResponse } from "@/connector/useGEFetchTypes";
import { oneHopNeighborsTemplate } from "./oneHopNeighborsTemplate";

import { type SparqlFetch, type SPARQLNeighborsRequest } from "../types";
import { logger } from "@/utils";
import { mapToResults, type RawOneHopNeighborsResponse } from "./mapToResults";

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
  const oneHopTemplate = oneHopNeighborsTemplate(req);
  logger.log("[SPARQL Explorer] Fetching oneHopNeighbors...", req);
  const data = await sparqlFetch<RawOneHopNeighborsResponse>(oneHopTemplate);
  logger.log("[SPARQL Explorer] Fetched oneHopNeighbors", data);

  const results = mapToResults(data.results.bindings);

  return {
    // Filter out the source vertex since it is already in the graph and this one is missing the attributes
    vertices: results.vertices.filter(v => v.id !== req.resourceURI),
    edges: results.edges,
  };
}
