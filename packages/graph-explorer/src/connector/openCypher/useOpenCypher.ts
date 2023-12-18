import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import fetchSchema from "./queries/fetchSchema";
import { GraphSummary } from "./types";
import { useCallback } from "react";
import useGEFetch from "../useGEFetch";
import { ConnectionConfig, useConfiguration } from "../../core";


const useOpenCypher = () => {
  const connection = useConfiguration()?.connection as ConnectionConfig | undefined;
  const useFetch = useGEFetch();
  const url = connection?.url;

  const _openCypherFetch = useCallback((options) => {
    return async (queryTemplate: string) => {
      return useFetch.request(`${url}/openCypher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryTemplate }),
        disableCache: options?.disableCache,
        ...options
      });
    };
  }, [url, useFetch]);

  const fetchSchemaFunc = useCallback(async (options) => {
    const ops = { ...options, disableCache: true };
    let summary;
    try {
      const response = await useFetch.request(`${url}/pg/statistics/summary?mode=detailed`, {
        method: "GET",
        ...ops
      });
      summary = response.payload.graphSummary as GraphSummary;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("[Summary API]", e);
      }
    }
    return fetchSchema(_openCypherFetch(ops), summary);
  }, [_openCypherFetch, url, useFetch]);

  const fetchVertexCountsByType = useCallback((req, options) => {
    return fetchVertexTypeCounts(_openCypherFetch(options), req);
  }, [_openCypherFetch]);

  const fetchNeighborsFunc = useCallback((req, options) => {
    return fetchNeighbors(_openCypherFetch(options), req);
  }, [_openCypherFetch]);

  const fetchNeighborsCountFunc = useCallback((req, options) => {
    return fetchNeighborsCount(_openCypherFetch(options), req);
  }, [_openCypherFetch]);

  const keywordSearchFunc = useCallback((req, options) => {
    return keywordSearch(_openCypherFetch(options), req);
  }, [_openCypherFetch]);

  return {
    fetchSchema: fetchSchemaFunc,
    fetchVertexCountsByType,
    fetchNeighbors: fetchNeighborsFunc,
    fetchNeighborsCount: fetchNeighborsCountFunc,
    keywordSearch: keywordSearchFunc,
  };
};

export default useOpenCypher;