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
import { logger } from "../../utils";

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

async function fetchSummary(
  connection: ConnectionConfig,
  options: RequestInit
) {
  try {
    const response = await fetchDatabaseRequest(
      connection,
      `${connection.url}/pg/statistics/summary?mode=detailed`,
      {
        method: "GET",
        ...options,
      }
    );
    return response.payload.graphSummary as GraphSummary;
  } catch (error) {
    logger.error(
      "[Gremlin Explorer] Failed to gather summary statistics",
      error
    );
  }
}

export function createGremlinExplorer(connection: ConnectionConfig): Explorer {
  return {
    connection: connection,
    async fetchSchema(options) {
      logger.log("[Gremlin Explorer] Fetching schema...");
      const summary = await fetchSummary(connection, options);
      return fetchSchema(_gremlinFetch(connection, options), summary);
    },
    async fetchVertexCountsByType(req, options) {
      logger.log("[Gremlin Explorer] Fetching vertex counts by type...");
      return fetchVertexTypeCounts(_gremlinFetch(connection, options), req);
    },
    async fetchNeighbors(req, options) {
      logger.log("[Gremlin Explorer] Fetching neighbors...");
      return fetchNeighbors(_gremlinFetch(connection, options), req);
    },
    async fetchNeighborsCount(req, options) {
      logger.log("[Gremlin Explorer] Fetching neighbors count...");
      return fetchNeighborsCount(_gremlinFetch(connection, options), req);
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      logger.log("[Gremlin Explorer] Fetching keyword search...");
      return keywordSearch(_gremlinFetch(connection, options), req);
    },
  };
}
