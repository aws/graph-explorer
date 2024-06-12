import { ConnectionConfig } from "../../core";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { GraphSummary } from "./types";
import { v4 } from "uuid";
import { Explorer } from "../useGEFetchTypes";
import { env } from "../../utils";

function _gremlinFetch(connection: ConnectionConfig, options: any) {
  return async (queryTemplate: string) => {
    const body = JSON.stringify({ query: queryTemplate });
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/vnd.gremlin-v3.0+json",
    };
    if (options?.queryId && connection?.proxyConnection === true) {
      headers.queryId = options.queryId;
    }

    return fetchDatabaseRequest(connection, `${connection.url}/gremlin`, {
      method: "POST",
      headers,
      body,
      ...options,
    });
  };
}

export function createGremlinExplorer(connection: ConnectionConfig): Explorer {
  return {
    connection: connection,
    async fetchSchema(options) {
      let summary;
      try {
        const response = await fetchDatabaseRequest(
          connection,
          `${connection.url}/pg/statistics/summary?mode=detailed`,
          {
            method: "GET",
            ...options,
          }
        );
        summary = (response.payload.graphSummary as GraphSummary) || undefined;
      } catch (e) {
        if (env.DEV) {
          console.error("[Summary API]", e);
        }
      }
      return fetchSchema(_gremlinFetch(connection, options), summary);
    },
    async fetchVertexCountsByType(req, options) {
      return fetchVertexTypeCounts(_gremlinFetch(connection, options), req);
    },
    async fetchNeighbors(req, options) {
      return fetchNeighbors(_gremlinFetch(connection, options), req);
    },
    async fetchNeighborsCount(req, options) {
      return fetchNeighborsCount(_gremlinFetch(connection, options), req);
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      return keywordSearch(_gremlinFetch(connection, options), req);
    },
  };
}
