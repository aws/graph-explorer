import {
  createVertexId,
  Edge,
  EdgeId,
  getRawId,
  Vertex,
  VertexId,
} from "@/core";
import type { NeighborsCountResponse } from "../useGEFetchTypes";
import { z } from "zod";
import { logger } from "@/utils";

export type SparqlFetch = <TResult = any>(
  queryTemplate: string
) => Promise<TResult>;

export type RawValue = {
  datatype?: string;
  type: string;
  value: string;
};

export type RawResult = {
  uri: string;
  class: string;
  attributes: Record<string, string | number>;
  isBlank: boolean;
};

export type SPARQLCriterion = {
  /**
   * Predicate URI.
   */
  predicate: string;
  /**
   * Object value.
   */
  object: any;
};

export type SPARQLNeighborsRequest = {
  /**
   * Resource URI.
   */
  resourceURI: VertexId;
  /**
   * Resource Class.
   */
  resourceClass: string;
  /**
   * Filter by subject classes
   */
  subjectClasses?: Array<string>;
  /**
   * Filter by predicates and objects matching values.
   */
  filterCriteria?: Array<SPARQLCriterion>;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
  /**
   * Skip the given number of results.
   */
  offset?: number;
};

export type SPARQLNeighborsPredicatesRequest = {
  /**
   * Resource URI.
   */
  resourceURI: VertexId;
  /**
   * All subjects URIs that are related to the resourceURI.
   */
  subjectURIs: VertexId[];
};

export type SPARQLBlankNodeNeighborsPredicatesRequest = {
  /**
   * Sub-query where the blank node was found.
   */
  subQuery: string;
  /**
   * All subjects URIs that are related to the resourceURI.
   */
  subjectURIs: VertexId[];
};

export type SPARQLNeighborsCountRequest = {
  /**
   * Resource URI.
   */
  resourceURI: VertexId;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
};

export type SPARQLBlankNodeNeighborsCountRequest = {
  /**
   * Sub-query where the blank node was found.
   */
  subQuery: string;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
};

export type SPARQLKeywordSearchRequest = {
  /**
   * Search term to match with object values
   */
  searchTerm?: string;
  /**
   * Filter by subject classes.
   */
  subjectClasses?: Array<string>;
  /**
   * Filter by subject predicates.
   */
  predicates?: Array<string>;
  /**
   * Limit the number of results.
   * 0 = No limit.
   */
  limit?: number;
  /**
   * Skip the given number of results.
   */
  offset?: number;
  /**
   * Filter by exact matching values.
   *
   */
  exactMatch?: boolean;
};

export type SPARQLBlankNodeNeighborsRequest = {
  resourceURI: VertexId;
  resourceClass: string;
  subQuery: string;
};

export type SPARQLBlankNodeNeighborsResponse = NeighborsCountResponse & {
  neighbors: {
    vertices: Array<Vertex>;
    edges: Array<Edge>;
  };
};

export type BlankNodeItem = {
  id: VertexId;
  subQueryTemplate: string;
  vertex: Vertex;
  neighborCounts: {
    totalCount: number;
    counts: Record<string, number>;
  };
  neighbors?: {
    vertices: Array<Vertex>;
    edges: Array<Edge>;
  };
};

export type BlankNodesMap = Map<VertexId, BlankNodeItem>;

export type GraphSummary = {
  numDistinctSubjects: number;
  numDistinctPredicates: number;
  numQuads: number;
  numClasses: number;
  classes: Array<string>;
  predicates: Array<Record<string, number>>;
};

export const rdfTypeUri = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

export const sparqlResponseHeadSchema = z.object({
  vars: z.array(z.string()),
});

export const sparqlStringValueSchema = z.object({
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlDateTimeValueSchema = z.object({
  datatype: z.literal("http://www.w3.org/2001/XMLSchema#dateTime"),
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlUriValueSchema = z.object({
  type: z.literal("uri"),
  value: z.string().url(),
});

export const sparqlBlankNodeSchema = z.object({
  type: z.literal("bnode"),
  value: z.string(),
});

export const sparqlNumberValueSchema = z.object({
  datatype: z.literal("http://www.w3.org/2001/XMLSchema#integer"),
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlValueSchema = z.object({
  datatype: z.string().optional(),
  type: z.string(),
  value: z.string(),
});
export type SparqlValue = z.infer<typeof sparqlValueSchema>;

export function sparqlResponseSchema<T extends z.ZodTypeAny>(
  bindingsSchema: T
) {
  return z.object({
    head: sparqlResponseHeadSchema,
    results: z.object({
      bindings: z.array(bindingsSchema),
    }),
  });
}
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

  const regex = /^(.*?)-\[(.*?)\]->(.*)$/;
  const match = rawEdgeId.match(regex);

  if (!match) {
    logger.error("Couldn't parse SPARQL edge ID", edgeId);
    throw new Error("Invalid edge ID");
  }

  return {
    source: createVertexId(match[1].trim()),
    predicate: match[2].trim(),
    target: createVertexId(match[3].trim()),
  };
}
