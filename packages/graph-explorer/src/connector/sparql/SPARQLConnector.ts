import type {
  KeywordSearchResponse,
  NeighborsCountRequest,
  NeighborsCountResponse,
  NeighborsRequest,
  NeighborsResponse,
  SchemaResponse,
} from "../AbstractConnector";
import {
  AbstractConnector,
  KeywordSearchRequest,
  QueryOptions,
} from "../AbstractConnector";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import keywordSearch from "./queries/keywordSearch";

export default class SPARQLConnector extends AbstractConnector {
  fetchSchema(options?: QueryOptions): Promise<SchemaResponse> {
    return fetchSchema(
      this._sparqlFetch(options),
      this._config.schema?.prefixes
    );
  }

  fetchNeighbors(
    req: NeighborsRequest,
    options?: QueryOptions
  ): Promise<NeighborsResponse> {
    return fetchNeighbors(this._sparqlFetch(options), {
      resourceURI: req.vertexId,
      resourceClass: req.vertexType,
      subjectClasses: req.filterByVertexTypes,
      filterCriteria: req.filterCriteria?.map(c => ({
        predicate: c.name,
        object: c.value,
      })),
      limit: req.limit,
      offset: req.offset,
    });
  }

  fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse> {
    return fetchNeighborsCount(this._sparqlFetch(options), {
      resourceURI: req.vertexId,
      limit: req.limit,
    });
  }

  keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse> {
    return keywordSearch(this._config, this._sparqlFetch(options), {
      searchTerm: req.searchTerm,
      subjectClasses: req.vertexTypes,
      predicates: req.searchByAttributes,
      limit: req.limit,
      offset: req.offset,
    });
  }

  private _sparqlFetch<TResult>(options?: QueryOptions) {
    return async (queryTemplate: string) => {
      const url = this._config.connection.url.replace(/\/$/, "");
      const encodedQuery = encodeURIComponent(queryTemplate);

      const uri = `${url}/sparql?query=${encodedQuery}`;

      const res = await fetch(uri, {
        signal: options?.abortSignal,
        headers: super.headers,
      });

      return res.json() as TResult;
    };
  }
}
