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
import { FeatureFlags, NormalizedConnection } from "@/core";
import { vertexDetails } from "./vertexDetails";
import { edgeDetails } from "./edgeDetails";
import { rawQuery } from "./rawQuery";

function _gremlinFetch(
  connection: NormalizedConnection,
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
  connection: NormalizedConnection,
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
  connection: NormalizedConnection,
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
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching vertex details...");
      const result = await vertexDetails(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
      return result;
    },
    async edgeDetails(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching edge details...");
      const result = await edgeDetails(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
      return result;
    },
    async rawQuery(req, options) {
      options ??= {};
      options.queryId = v4();
      remoteLogger.info("[Gremlin Explorer] Fetching raw query...");
      const result = await rawQuery(
        _gremlinFetch(connection, featureFlags, options),
        req
      );
      return result;
    },
  } satisfies Explorer;
}
