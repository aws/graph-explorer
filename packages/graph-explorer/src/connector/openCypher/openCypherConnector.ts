import type {
    CountsByTypeRequest,
    CountsByTypeResponse,
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
  import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
  import keywordSearch from "./queries/keywordSearch";
  import fetchSchema from "./queries/fetchSchema";
  import { GraphSummary } from "./types";
  
  export default class OpenCypherConnector extends AbstractConnector {
    protected readonly basePath = "/openCypher?query=";
    private readonly _summaryPath = "/pg/statistics/summary?mode=detailed";
  
    async fetchSchema(options?: QueryOptions): Promise<SchemaResponse> {
      const ops = { ...options, disableCache: true };
      let summary: GraphSummary | undefined;
      try {
        const response = await this.request<{
          payload: { graphSummary: GraphSummary };
        }>(this._summaryPath, ops);
        summary = response.payload.graphSummary;
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("[Summary API]", e);
        }
      }
  
      return fetchSchema(this._openCypherFetch(ops), summary);
    }
  
    fetchVertexCountsByType(
      req: CountsByTypeRequest,
      options: QueryOptions | undefined
    ): Promise<CountsByTypeResponse> {
      return fetchVertexTypeCounts(this._openCypherFetch(options), req);
    }
  
    fetchNeighbors(
      req: NeighborsRequest,
      options: QueryOptions | undefined
    ): Promise<NeighborsResponse> {
      return fetchNeighbors(this._openCypherFetch(options), req);
    }
  
    fetchNeighborsCount(
      req: NeighborsCountRequest,
      options?: QueryOptions
    ): Promise<NeighborsCountResponse> {
      return fetchNeighborsCount(this._openCypherFetch(options), req);
    }
  
    keywordSearch(
      req: KeywordSearchRequest,
      options?: QueryOptions
    ): Promise<KeywordSearchResponse> {
      return keywordSearch(this._openCypherFetch(options), req);
    }
  
    private _openCypherFetch<TResult>(options?: QueryOptions) {
      return async (queryTemplate: string) => {
        return super.requestQueryTemplate<TResult>(queryTemplate, {
          signal: options?.abortSignal,
          disableCache: options?.disableCache,
        });
      };
    }
  }
  