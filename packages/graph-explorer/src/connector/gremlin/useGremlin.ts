import { useCallback, useMemo } from "react";
import { ConnectionConfig, useConfiguration } from "../../core";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import useGEFetch from "../useGEFetch";
import { GraphSummary } from "./types";
import { v4 } from "uuid";

const useGremlin = () => {
  const connection = useConfiguration()?.connection as
    | ConnectionConfig
    | undefined;

  const useFetch = useGEFetch();
  const url = connection?.url;
  const _rawIdTypeMap = useMemo(() => {
    return new Map<string, "string" | "number">();
  }, []);

  const _gremlinFetch = useCallback(
    options => {
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

        return useFetch.request(`${url}/gremlin`, {
          method: "POST",
          headers,
          body,
          ...options,
        });
      };
    },
    [url, useFetch]
  );

  const fetchSchemaFunc = useCallback(
    async options => {
      let summary;
      try {
        const response = await useFetch.request(
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
      return fetchSchema(_gremlinFetch(options), summary);
    },
    [_gremlinFetch, url, useFetch]
  );

  const fetchVertexCountsByType = useCallback(
    (req, options) => {
      return fetchVertexTypeCounts(_gremlinFetch(options), req);
    },
    [_gremlinFetch]
  );

  const fetchNeighborsFunc = useCallback(
    (req, options) => {
      return fetchNeighbors(_gremlinFetch(options), req, _rawIdTypeMap);
    },
    [_gremlinFetch, _rawIdTypeMap]
  );

  const fetchNeighborsCountFunc = useCallback(
    (req, options) => {
      return fetchNeighborsCount(_gremlinFetch(options), req, _rawIdTypeMap);
    },
    [_gremlinFetch, _rawIdTypeMap]
  );

  const keywordSearchFunc = useCallback(
    (req, options) => {
      options ??= {};
      options.queryId = v4();

      return keywordSearch(_gremlinFetch(options), req, _rawIdTypeMap);
    },
    [_gremlinFetch, _rawIdTypeMap]
  );

  return {
    fetchSchema: fetchSchemaFunc,
    fetchVertexCountsByType,
    fetchNeighbors: fetchNeighborsFunc,
    fetchNeighborsCount: fetchNeighborsCountFunc,
    keywordSearch: keywordSearchFunc,
  };
};

export default useGremlin;
