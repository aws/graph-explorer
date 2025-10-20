import { Edge, Vertex, VertexId } from "@/core";
import type { NeighborCount } from "../useGEFetchTypes";
import { z } from "zod";

export type SparqlFetch = <TResult = any>(
  queryTemplate: string
) => Promise<TResult>;

export type SPARQLCriterion = {
  /**
   * Predicate URI.
   */
  predicate: string;
  /**
   * Object value.
   */
  object: string;
};

export type SPARQLNeighborsRequest = {
  /**
   * Resource URI.
   */
  resourceURI: VertexId;
  /**
   * Resource classes.
   */
  resourceClasses: Vertex["types"];
  /**
   * Filter by subject classes
   */
  subjectClasses?: Array<string>;
  /**
   * Filter by predicates and objects matching values.
   */
  filterCriteria?: Array<SPARQLCriterion>;
  /**
   * Exclude vertices from the results.
   */
  excludedVertices?: Set<VertexId>;
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
  resourceClasses: Vertex["types"];
  subQuery: string;
};

export type SPARQLBlankNodeNeighborsResponse = NeighborCount & {
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

export const sparqlResourceValueSchema = z.union([
  sparqlUriValueSchema,
  sparqlBlankNodeSchema,
]);

export const sparqlNumberValueSchema = z.object({
  datatype: z.literal("http://www.w3.org/2001/XMLSchema#integer"),
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlValueSchema = z.object({
  datatype: z.string().optional(),
  type: z.string(),
  value: z.string(),
  "xml:lang": z.string().optional(),
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

export const sparqlAskResponseSchema = z.object({
  head: z.object({}),
  boolean: z.boolean(),
});

export const sparqlQuadBindingSchema = z
  .object({
    subject: sparqlResourceValueSchema,
    predicate: sparqlUriValueSchema,
    object: sparqlValueSchema,
    graph: sparqlValueSchema.optional(),
  })
  .strict();
export type SparqlQuadBinding = z.infer<typeof sparqlQuadBindingSchema>;
