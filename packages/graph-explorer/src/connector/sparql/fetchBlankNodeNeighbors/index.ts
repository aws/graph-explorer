import { createEdge, createVertex, type Vertex, type VertexType } from "@/core";
import { logger } from "@/utils";

import type {
  SPARQLBlankNodeNeighborsRequest,
  SPARQLBlankNodeNeighborsResponse,
  SparqlFetch,
} from "../types";

import { parseAndMapQuads } from "../parseAndMapQuads";
import blankNodeOneHopNeighborsTemplate from "./blankNodeOneHopNeighborsTemplate";

export default async function fetchBlankNodeNeighbors(
  sparqlFetch: SparqlFetch,
  req: SPARQLBlankNodeNeighborsRequest,
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
        edge.sourceId === req.resourceURI || edge.targetId === req.resourceURI,
    )
    .map(createEdge);

  const vertices = results.vertices
    .filter(
      v =>
        v.id !== req.resourceURI &&
        edges.find(e => e.sourceId === v.id || e.targetId === v.id),
    )
    .map(createVertex);

  return {
    vertexId: req.resourceURI,
    totalCount: vertices.length,
    counts: vertexCountsByType(vertices),
    neighbors: {
      vertices,
      edges,
    },
  };
}

function vertexCountsByType(vertices: Vertex[]) {
  const counts = new Map<VertexType, number>();
  for (const vertex of vertices) {
    counts.set(vertex.type, (counts.get(vertex.type) ?? 0) + 1);
  }
  return counts;
}
