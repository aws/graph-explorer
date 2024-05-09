import { ConnectionConfig } from "../../core";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { GraphSummary } from "./types";
import { v4 } from "uuid";
import { Explorer } from "../../core/ConnectorProvider/types";

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

export function createGremlinExplorer(
  connection: ConnectionConfig | undefined
): Explorer {
  const url = connection?.url;

  return {
    async fetchSchema(options) {
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
