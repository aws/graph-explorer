import { EdgeId, VertexId, getRawId, createVertexId } from "@/core";
import { logger } from "@/utils";

/**
 * Parses out the source, target, and predicate from the edge ID.
 *
 * @param edgeId a synthetic id created using <source URI>-[predicate]-><target URI>
 */
export function parseEdgeId(edgeId: EdgeId): {
  source: VertexId;
  target: VertexId;
  predicate: string;
} {
  const rawEdgeId = getRawId(edgeId);
  if (typeof rawEdgeId !== "string") {
    logger.error("SPARQL EdgeId values must be of type string");
    throw new Error("SPARQL EdgeId values must be of type string");
  }

  const result = parseRdfEdgeIdString(rawEdgeId);

  if (!result) {
    logger.error("Couldn't parse SPARQL edge ID", edgeId);
    throw new Error("Invalid RDF edge ID");
  }

  return {
    source: createVertexId(result.source),
    predicate: result.predicate,
    target: createVertexId(result.target),
  };
}

export function parseRdfEdgeIdString(value: string) {
  const regex = /^(.*?)-\[(.*?)\]->(.*)$/;
  const match = value.match(regex);

  if (!match || match.length !== 4) {
    return null;
  }

  const source = match[1].trim();
  const predicate = match[2].trim();
  const target = match[3].trim();

  return { source, predicate, target };
}
