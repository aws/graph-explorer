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
import { v4 } from "uuid";

const useOpenCypher = () => {
  const connection = useConfiguration()?.connection as
    | ConnectionConfig
    | undefined;
  const useFetch = useGEFetch();
  const url = connection?.url;
  const serviceType = connection?.serviceType || DEFAULT_SERVICE_TYPE;

  const _openCypherFetch = useCallback(
    options => {
      return async (queryTemplate: string) => {
        const headers = options.queryId
          ? {
              "Content-Type": "application/json",
              queryId: options.queryId,
            }
          : {
              "Content-Type": "application/json",
            };
        return useFetch.request(`${url}/openCypher`, {
          method: "POST",
          headers,
          body: JSON.stringify({ query: queryTemplate }),
          disableCache: options?.disableCache,
          successCallback: options?.successCallback,
          ...options,
        });
      };
    },
    [url, useFetch]
  );

  const _openCypherCancel = useCallback(() => {
    return async (queryId: string) => {
      return useFetch.request(`${url}/openCypher/cancel`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          queryId: queryId,
        },
      });
    };
  }, [url, useFetch]);

  const fetchSchemaFunc = useCallback(
    async (options: any) => {
      const ops = { ...options, disableCache: true };

      let summary;
      try {
        const endpoint =
          serviceType === DEFAULT_SERVICE_TYPE
            ? `${url}/pg/statistics/summary?mode=detailed`
            : `${url}/summary?mode=detailed`;
        const response = await useFetch.request(endpoint, {
          method: "GET",
          ...ops,
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
      return fetchSchema(_openCypherFetch(ops), summary);
    },
    [_openCypherFetch, url, useFetch]
  );

  const fetchVertexCountsByType = useCallback(
    (req, options) => {
      return fetchVertexTypeCounts(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const fetchNeighborsFunc = useCallback(
    (req, options) => {
      return fetchNeighbors(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  const fetchNeighborsCountFunc = useCallback(
    (req, options) => {
      return fetchNeighborsCount(_openCypherFetch(options), req);
    },
    [_openCypherFetch]
  );

  let keywordSearchQueryId: string | undefined;
  const keywordSearchFunc = useCallback(
    (req, options) => {
      if (keywordSearchQueryId) {
        console.log("canceling: ", keywordSearchQueryId); // !!!
        // no need to wait for confirmation
        _openCypherCancel()(keywordSearchQueryId);
      }

      options ??= {};
      options.queryId = v4();
      keywordSearchQueryId = options.queryId;
      console.log("starting: ", keywordSearchQueryId); // !!!
      options.successCallback = () => {
        console.log("done: ", keywordSearchQueryId); // !!!
        keywordSearchQueryId = undefined;
      };

      return keywordSearch(_openCypherFetch(options), req);
    },
    [_openCypherFetch, _openCypherCancel]
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
