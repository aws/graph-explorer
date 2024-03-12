import LoggerConnector from "../../connector/LoggerConnector";
import {
  CountsByTypeResponse,
  KeywordSearchRequest,
  KeywordSearchResponse,
  NeighborsCountResponse,
  NeighborsResponse,
  SchemaResponse,
} from "../../connector/useGEFetchTypes";

type Explorer = {
  fetchSchema: (options?: any) => Promise<SchemaResponse>;
  fetchVertexCountsByType: (
    req: any,
    options?: any
  ) => Promise<CountsByTypeResponse>;
  fetchNeighbors: (
    req: any,
    options?: any
  ) => Promise<NeighborsResponse> | Promise<unknown>;
  fetchNeighborsCount: (
    req: any,
    options?: any
  ) => Promise<NeighborsCountResponse>;
  keywordSearch: (
    req: KeywordSearchRequest,
    options?: any
  ) => Promise<KeywordSearchResponse>;
};

export type ConnectorContextProps = {
  explorer?: Explorer;
  logger?: LoggerConnector;
};
