import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import fetchSchema from "./queries/fetchSchema";
import { GraphSummary } from "./types";
import { useCallback } from "react";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { ConnectionConfig, useConfiguration } from "../../core";
import { DEFAULT_SERVICE_TYPE } from "../../utils/constants";
import { Explorer } from "../../core/ConnectorProvider/types";
import {
  KeywordSearchRequest,
  NeighborsCountRequest,
  NeighborsRequest,
} from "../useGEFetchTypes";

const useOpenCypher = (): Explorer => {
  const connection = useConfiguration()?.connection as
    | ConnectionConfig
    | undefined;
  const url = connection?.url;
  const serviceType = connection?.serviceType || DEFAULT_SERVICE_TYPE;

  const _openCypherFetch = useCallback(
    (options: any) => {
      return async (queryTemplate: string) => {
        return fetchDatabaseRequest(connection, `${url}/openCypher`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: queryTemplate }),
          ...options,
        });
      };
    },
    [connection, url]
  );

  const fetchSchemaFunc = useCallback(
    async (options?: any) => {
      let summary;
      try {
        const endpoint =
          serviceType === DEFAULT_SERVICE_TYPE
            ? `${url}/pg/statistics/summary?mode=detailed`
            : `${url}/summary?mode=detailed`;
        const response = await fetchDatabaseRequest(connection, endpoint, {
          method: "GET",
          ...options,
        });

        summary =
          (response.payload
            ? (response.payload.graphSummary as GraphSummary)
            : (response.graphSummary as GraphSummary)) || undefined;
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("[Summary API]", e);
        }
      }
      return fetchSchema(_openCypherFetch(options), summary);
    },
    [_openCypherFetch, serviceType, url, connection]
  );

  const fetchVertexCountsByType = useCallback(
    (req: any, options?: any) => {
      return fetchVertexTypeCounts(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const fetchNeighborsFunc = useCallback(
    (req: NeighborsRequest, options?: any) => {
      return fetchNeighbors(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const fetchNeighborsCountFunc = useCallback(
    (req: NeighborsCountRequest, options?: any) => {
      return fetchNeighborsCount(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const keywordSearchFunc = useCallback(
    (req: KeywordSearchRequest, options?: any) => {
      return keywordSearch(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  return {
    fetchSchema: fetchSchemaFunc,
    fetchVertexCountsByType,
    fetchNeighbors: fetchNeighborsFunc,
    fetchNeighborsCount: fetchNeighborsCountFunc,
    keywordSearch: keywordSearchFunc,
  };
};

export default useOpenCypher;
