import { v4 } from "uuid";

import type { FeatureFlags, NormalizedConnection } from "@/core";

import { createLoggerFromConnection } from "@/core/connector";
import { logger } from "@/utils";

import type { Explorer, ExplorerRequestOptions } from "../useGEFetchTypes";
import type { GraphSummary, GremlinFetch } from "./types";

import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { edgeDetails } from "./edgeDetails";
import fetchEdgeConnections from "./fetchEdgeConnections";
import fetchNeighbors from "./fetchNeighbors";
import fetchSchema from "./fetchSchema";
import fetchVertexTypeCounts from "./fetchVertexTypeCounts";
import filterAndSortSearch from "./filterAndSort";
import keywordSearch from "./keywordSearch";
import { neighborCounts } from "./neighborCounts";
import { rawQuery } from "./rawQuery";
import { vertexDetails } from "./vertexDetails";

function _gremlinFetch(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  options?: ExplorerRequestOptions,
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
      },
    );
  };
}

async function fetchSummary(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  options?: RequestInit,
) {
  try {
    const response = await fetchDatabaseRequest(
      connection,
      featureFlags,
      `${connection.url}/pg/statistics/summary?mode=detailed`,
      {
        method: "GET",
        ...options,
      },
    );
    return response.payload.graphSummary as GraphSummary;
  } catch (error) {
    logger.error(
      "[Gremlin Explorer] Failed to gather summary statistics",
      error,
    );
  }
}

export function createGremlinExplorer(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
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
        summary,
      );
    },
    async fetchVertexCountsByType(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching vertex counts by type...");
      return fetchVertexTypeCounts(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
    },
    async fetchNeighbors(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching neighbors...");
      return fetchNeighbors(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
    },
    async neighborCounts(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching neighbors count...");
      return neighborCounts(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching keyword search...");
      return keywordSearch(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
    },
    async filterAndSortSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching filter and sort...");
      return filterAndSortSearch(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
    },
    async vertexDetails(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching vertex details...");
      const result = await vertexDetails(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
      return result;
    },
    async edgeDetails(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[Gremlin Explorer] Fetching edge details...");
      const result = await edgeDetails(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
      return result;
    },
    async rawQuery(req, options) {
      options ??= {};
      options.queryId = v4();
      remoteLogger.info("[Gremlin Explorer] Fetching raw query...");
      const result = await rawQuery(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
      return result;
    },
    async fetchEdgeConnections(req, options) {
      remoteLogger.info("[Gremlin Explorer] Fetching edge connections...");
      return fetchEdgeConnections(
        _gremlinFetch(connection, featureFlags, options),
        req,
      );
    },
  } satisfies Explorer;
}
