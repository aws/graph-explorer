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
