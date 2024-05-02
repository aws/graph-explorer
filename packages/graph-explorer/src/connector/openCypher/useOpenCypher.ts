import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import fetchSchema from "./queries/fetchSchema";
import { GraphSummary } from "./types";
import { useCallback } from "react";
import useGEFetch from "../useGEFetch";
import { ConnectionConfig, useConfiguration } from "../../core";
import { DEFAULT_SERVICE_TYPE } from "../../utils/constants";

const useOpenCypher = () => {
  const connection = useConfiguration()?.connection as
    | ConnectionConfig
    | undefined;
  const useFetch = useGEFetch();
  const url = connection?.url;
  const serviceType = connection?.serviceType || DEFAULT_SERVICE_TYPE;

  const _openCypherFetch = useCallback(
    (options: any) => {
      return async (queryTemplate: string) => {
        return useFetch.request(`${url}/openCypher`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: queryTemplate }),
          ...options,
        });
      };
    },
    [url, useFetch]
  );

  const fetchSchemaFunc = useCallback(
    async (options: any) => {
      let summary;
      try {
        const endpoint =
          serviceType === DEFAULT_SERVICE_TYPE
            ? `${url}/pg/statistics/summary?mode=detailed`
            : `${url}/summary?mode=detailed`;
        const response = await useFetch.request(endpoint, {
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
    [_openCypherFetch, url, useFetch, serviceType]
  );

  const fetchVertexCountsByType = useCallback(
    (req: any, options: any) => {
      return fetchVertexTypeCounts(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const fetchNeighborsFunc = useCallback(
    (req: any, options: any) => {
      return fetchNeighbors(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const fetchNeighborsCountFunc = useCallback(
    (req: any, options: any) => {
      return fetchNeighborsCount(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const keywordSearchFunc = useCallback(
    (req: any, options: any) => {
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
