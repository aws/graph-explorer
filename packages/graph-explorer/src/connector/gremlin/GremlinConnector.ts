import type {
  KeywordSearchRequest,
  KeywordSearchResponse,
  NeighborsCountRequest,
  NeighborsCountResponse,
  NeighborsRequest,
  NeighborsResponse,
  QueryOptions,
  SchemaResponse,
} from "../AbstractConnector";
import { AbstractConnector } from "../AbstractConnector";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import keywordSearch from "./queries/keywordSearch";

export default class GremlinConnector extends AbstractConnector {
  protected readonly basePath = "/?gremlin=";

  fetchSchema(options?: QueryOptions): Promise<SchemaResponse> {
    return fetchSchema(this._gremlinFetch(options));
  }

  fetchNeighbors(
    req: NeighborsRequest,
    options: QueryOptions | undefined
  ): Promise<NeighborsResponse> {
    return fetchNeighbors(this._gremlinFetch(options), req);
  }

  fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse> {
    return fetchNeighborsCount(this._gremlinFetch(options), req);
  }

  keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse> {
    return keywordSearch(this._gremlinFetch(options), req);
  }

  private _gremlinFetch<TResult>(options?: QueryOptions) {
    return async (queryTemplate: string) => {
      return super.request<TResult>(queryTemplate, {
        signal: options?.abortSignal,
      });
    };
  }
}
