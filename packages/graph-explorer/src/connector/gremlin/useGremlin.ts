import { useCallback, useMemo } from "react";
import { ConnectionConfig, useConfiguration } from "../../core";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { GraphSummary } from "./types";
import { v4 } from "uuid";
import { Explorer } from "../../core/ConnectorProvider/types";
import {
  KeywordSearchRequest,
  NeighborsCountRequest,
  NeighborsRequest,
} from "../useGEFetchTypes";

function _gremlinFetch(connection: ConnectionConfig | undefined, options: any) {
  const url = connection?.url;
  return async (queryTemplate: string) => {
    const body = JSON.stringify({ query: queryTemplate });
    const headers = options?.queryId
      ? {
          "Content-Type": "application/json",
          queryId: options.queryId,
        }
      : {
          "Content-Type": "application/json",
        };

    return fetchDatabaseRequest(connection, `${url}/gremlin`, {
      method: "POST",
      headers,
      body,
      ...options,
    });
  };
}

const useGremlin = (): Explorer => {
  const connection = useConfiguration()?.connection as
    | ConnectionConfig
    | undefined;

  const url = connection?.url;
  const _rawIdTypeMap = useMemo(() => {
    return new Map<string, "string" | "number">();
  }, []);

  const fetchSchemaFunc = useCallback(
    async (options?: any) => {
      let summary;
      try {
        const response = await fetchDatabaseRequest(
          connection,
          `${url}/pg/statistics/summary?mode=detailed`,
          {
            method: "GET",
            ...options,
          }
        );
        summary = (response.payload.graphSummary as GraphSummary) || undefined;
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("[Summary API]", e);
        }
      }
      return fetchSchema(_gremlinFetch(connection, options), summary);
    },
    [connection, url]
  );

  const fetchVertexCountsByType = useCallback(
    (req: any, options: any) => {
      return fetchVertexTypeCounts(_gremlinFetch(connection, options), req);
    },
    [connection]
  );

  const fetchNeighborsFunc = useCallback(
    (req: NeighborsRequest, options?: any) => {
      return fetchNeighbors(
        _gremlinFetch(connection, options),
        req,
        _rawIdTypeMap
      );
    },
    [_rawIdTypeMap, connection]
  );

  const fetchNeighborsCountFunc = useCallback(
    (req: NeighborsCountRequest, options?: any) => {
      return fetchNeighborsCount(
        _gremlinFetch(connection, options),
        req,
        _rawIdTypeMap
      );
    },
    [_rawIdTypeMap, connection]
  );

  const keywordSearchFunc = useCallback(
    (req: KeywordSearchRequest, options?: any) => {
      options ??= {};
      options.queryId = v4();

      return keywordSearch(
        _gremlinFetch(connection, options),
        req,
        _rawIdTypeMap
      );
    },
    [_rawIdTypeMap, connection]
  );

  const explorer: Explorer = {
    fetchSchema: fetchSchemaFunc,
    fetchVertexCountsByType,
    fetchNeighbors: fetchNeighborsFunc,
    fetchNeighborsCount: fetchNeighborsCountFunc,
    keywordSearch: keywordSearchFunc,
  };

  return explorer;
};

export default useGremlin;
