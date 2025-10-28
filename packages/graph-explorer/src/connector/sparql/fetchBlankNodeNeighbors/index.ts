import groupBy from "lodash/groupBy";
import blankNodeOneHopNeighborsTemplate from "./blankNodeOneHopNeighborsTemplate";
import type {
  SPARQLBlankNodeNeighborsRequest,
  SPARQLBlankNodeNeighborsResponse,
  SparqlFetch,
} from "../types";
import { logger } from "@/utils";
import { createEdge, createVertex } from "@/core";
import { parseAndMapQuads } from "../parseAndMapQuads";

export default async function fetchBlankNodeNeighbors(
  sparqlFetch: SparqlFetch,
  req: SPARQLBlankNodeNeighborsRequest
): Promise<SPARQLBlankNodeNeighborsResponse> {
  logger.log("[SPARQL Explorer] Fetching blank node one hop neighbors", req);
  const neighborsTemplate = blankNodeOneHopNeighborsTemplate(req.subQuery);
  const data = await sparqlFetch(neighborsTemplate);
  logger.log("[SPARQL Explorer] Fetched oneHopNeighbors", data);

  // Map to fully materialized entities
  const results = parseAndMapQuads(data);
  const edges = results.edges
    .filter(
      edge =>
        edge.sourceId === req.resourceURI || edge.targetId === req.resourceURI
    )
    .map(createEdge);

  const vertices = results.vertices
    .filter(
      v =>
        v.id !== req.resourceURI &&
        edges.find(e => e.sourceId === v.id || e.targetId === v.id)
    )
    .map(createVertex);

  return {
    vertexId: req.resourceURI,
    totalCount: vertices.length,
    counts: Object.entries(groupBy(vertices, v => v.type)).reduce(
      (counts, [group, vs]) => {
        counts[group] = vs.length;
        return counts;
      },
      {} as Record<string, number>
    ),
    neighbors: {
      vertices,
      edges,
    },
  };
}
