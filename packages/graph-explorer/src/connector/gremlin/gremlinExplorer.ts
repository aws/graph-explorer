import { ConnectionConfig } from "@shared/types";
import fetchNeighbors from "./fetchNeighbors";
import fetchNeighborsCount from "./fetchNeighborsCount";
import fetchSchema from "./fetchSchema";
import fetchVertexTypeCounts from "./fetchVertexTypeCounts";
import keywordSearch from "./keywordSearch";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { GraphSummary, GremlinFetch } from "./types";
import { v4 } from "uuid";
import { Explorer, ExplorerRequestOptions } from "../useGEFetchTypes";
import { logger } from "@/utils";
import { createLoggerFromConnection } from "@/core/connector";
import { FeatureFlags } from "@/core";

function _gremlinFetch(
  connection: ConnectionConfig,
  featureFlags: FeatureFlags,
  options?: ExplorerRequestOptions
): GremlinFetch {
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

    return fetchDatabaseRequest(
      connection,
      featureFlags,
      `${connection.url}/gremlin`,
      {
        method: "POST",
        headers,
        body,
        ...options,
      }
    );
  };
}

async function fetchSummary(
  connection: ConnectionConfig,
  featureFlags: FeatureFlags,
  options?: RequestInit
) {
  try {
    const response = await fetchDatabaseRequest(
      connection,
      featureFlags,
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

export function createGremlinExplorer(
  connection: ConnectionConfig,
  featureFlags: FeatureFlags
): Explorer {
  const remoteLogger = createLoggerFromConnection(connection);
  return {
    connection: connection,
    async fetchSchema(options) {
      remoteLogger.info("[Gremlin Explorer] Fetching schema...");
      const summary = await fetchSummary(connection, featureFlags, options);
      return fetchSchema(
        _gremlinFetch(connection, featureFlags, options),
        remoteLogger,
        summary
      );
    },
    async fetchVertexCountsByType(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching vertex counts by type...");
      return fetchVertexTypeCounts(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
    },
    async fetchNeighbors(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching neighbors...");
      return fetchNeighbors(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
    },
    async fetchNeighborsCount(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching neighbors count...");
      return fetchNeighborsCount(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching keyword search...");
      return keywordSearch(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
    },
    async vertexDetails(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching vertex details...");
      throw new Error("Vertex details explorer function is not implemented");
    },
    async edgeDetails(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching edge details...");
      throw new Error("Edge details explorer function is not implemented");
    },
  } satisfies Explorer;
}
