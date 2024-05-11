import LoggerConnector from "../../connector/LoggerConnector";
import {
  CountsByTypeRequest,
  CountsByTypeResponse,
  KeywordSearchRequest,
  KeywordSearchResponse,
  NeighborsCountRequest,
  NeighborsCountResponse,
  NeighborsRequest,
  NeighborsResponse,
  SchemaResponse,
} from "../../connector/useGEFetchTypes";

export type Explorer = {
  fetchSchema: (options?: any) => Promise<SchemaResponse>;
  fetchVertexCountsByType: (
    req: CountsByTypeRequest,
    options?: any
  ) => Promise<CountsByTypeResponse>;
  fetchNeighbors: (
    req: NeighborsRequest,
    options?: any
  ) => Promise<NeighborsResponse>;
  fetchNeighborsCount: (
    req: NeighborsCountRequest,
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
