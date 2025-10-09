import {
  type Edge,
  type EntityProperties,
  type Vertex,
  type VertexId,
} from "@/core";
import type { NeighborCount } from "../useGEFetchTypes";
import type { z } from "zod";
import type { sparqlValueSchema } from "./schemas";

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
  attributes: EntityProperties;
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

export type SparqlValue = z.infer<typeof sparqlValueSchema>;

export const rdfTypeUri = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
