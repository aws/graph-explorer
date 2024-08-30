import { ConnectionConfig } from "@shared/types";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { GraphSummary } from "./types";
import { v4 } from "uuid";
import { Explorer, ExplorerRequestOptions } from "../useGEFetchTypes";
import { logger } from "@/utils";
import { createLoggerFromConnection } from "@/core/connector";

function _gremlinFetch(
  connection: ConnectionConfig,
  options?: ExplorerRequestOptions
) {
  return async (queryTemplate: string) => {
    logger.debug(queryTemplate);
    const body = JSON.stringify({ query: queryTemplate });
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/vnd.gremlin-v3.0+json",
    };
    if (options?.queryId && connection.proxyConnection === true) {
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
  const remoteLogger = createLoggerFromConnection(connection);
  return {
    connection: connection,
    async fetchSchema(options) {
      remoteLogger.info("[Gremlin Explorer] Fetching schema...");
      const summary = await fetchSummary(connection, options);
      return fetchSchema(_gremlinFetch(connection, options), summary);
    },
    async fetchVertexCountsByType(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching vertex counts by type...");
      return fetchVertexTypeCounts(_gremlinFetch(connection, options), req);
    },
    async fetchNeighbors(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching neighbors...");
      return fetchNeighbors(_gremlinFetch(connection, options), req);
    },
    async fetchNeighborsCount(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching neighbors count...");
      return fetchNeighborsCount(_gremlinFetch(connection, options), req);
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching keyword search...");
      return keywordSearch(_gremlinFetch(connection, options), req);
    },
  } satisfies Explorer;
}
