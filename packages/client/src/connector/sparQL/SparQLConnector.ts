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

export default class SparQLConnector extends AbstractConnector {
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
    return fetchNeighbors(this._config, this._sparqlFetch(options), req);
  }

  fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse> {
    return fetchNeighborsCount(this._sparqlFetch(options), req);
  }

  keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse> {
    return keywordSearch(this._config, this._sparqlFetch(options), req);
  }

  private _sparqlFetch<TResult>(options?: QueryOptions) {
    return async (queryTemplate: string) => {
      const url = this._config.connection.url;
      const encodedQuery = encodeURIComponent(queryTemplate);

      const uri = `${url}/sparql?query=${encodedQuery}`;
      const headers = super.authorizationHeaders("GET", new URL(uri));

      const res = await fetch(uri, {
        signal: options?.abortSignal,
        headers,
      });

      return res.json() as TResult;
    };
  }
}
