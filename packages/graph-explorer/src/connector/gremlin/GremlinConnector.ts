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
import fetchSchema from "./queries/fetchSchema";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import { GraphSummary } from "./types";

export default class GremlinConnector extends AbstractConnector {
  protected readonly basePath = "/?gremlin=";
  private readonly _summaryPath = "/pg/statistics/summary?mode=detailed";

  // Stores the id type before casting it to string
  private _rawIdTypeMap: Map<string, "string" | "number"> = new Map();

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

    return fetchSchema(this._gremlinFetch(ops), summary);
  }

  fetchVertexCountsByType(
    req: CountsByTypeRequest,
    options: QueryOptions | undefined
  ): Promise<CountsByTypeResponse> {
    return fetchVertexTypeCounts(this._gremlinFetch(options), req);
  }

  fetchNeighbors(
    req: NeighborsRequest,
    options: QueryOptions | undefined
  ): Promise<NeighborsResponse> {
    return fetchNeighbors(this._gremlinFetch(options), req, this._rawIdTypeMap);
  }

  fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse> {
    return fetchNeighborsCount(
      this._gremlinFetch(options),
      req,
      this._rawIdTypeMap
    );
  }

  keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse> {
    return keywordSearch(this._gremlinFetch(options), req, this._rawIdTypeMap);
  }

  private _gremlinFetch<TResult>(options?: QueryOptions) {
    return async (queryTemplate: string) => {
      return super.requestQueryTemplate<TResult>(queryTemplate, {
        signal: options?.abortSignal,
        disableCache: options?.disableCache,
      });
    };
  }
} 