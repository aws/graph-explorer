import { Edge, Vertex } from "../../@types/entities";
import { NeighborsCountResponse } from "../AbstractConnector";

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
  resourceURI: string;
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
  resourceURI: string;
  /**
   * All subjects URIs that are related to the resourceURI.
   */
  subjectURIs: string[];
};

export type SPARQLBlankNodeNeighborsPredicatesRequest = {
  /**
   * Sub-query where the blank node was found.
   */
  subQuery: string;
  /**
   * All subjects URIs that are related to the resourceURI.
   */
  subjectURIs: string[];
};

export type SPARQLNeighborsCountRequest = {
  /**
   * Resource URI.
   */
  resourceURI: string;
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
};

export type SPARQLBlankNodeNeighborsRequest = {
  resourceURI: string;
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
  id: string;
  subQueryTemplate: string;
  vertex: Vertex;
  neighbors?: {
    vertices: Array<Vertex>;
    edges: Array<Edge>;
  };
};

export type BlankNodesMap = Map<string, BlankNodeItem>;

export type GraphSummary = {
  numDistinctSubjects: number;
  numDistinctPredicates: number;
  numQuads: number;
  numClasses: number;
  classes: Array<string>;
  predicates: Array<Record<string, number>>;
};
