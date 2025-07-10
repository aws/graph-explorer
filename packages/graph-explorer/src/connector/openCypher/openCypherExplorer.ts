import fetchNeighbors from "./fetchNeighbors";
import fetchNeighborsCount from "./fetchNeighborsCount";
import fetchVertexTypeCounts from "./fetchVertexTypeCounts";
import keywordSearch from "./keywordSearch";
import fetchSchema from "./fetchSchema";
import { GraphSummary } from "./types";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { DEFAULT_SERVICE_TYPE } from "@/utils/constants";
import { Explorer, ExplorerRequestOptions } from "../useGEFetchTypes";
import { env, logger } from "@/utils";
import { createLoggerFromConnection } from "@/core/connector";
import { FeatureFlags, NormalizedConnection } from "@/core";
import { vertexDetails } from "./vertexDetails";
import { edgeDetails } from "./edgeDetails";
import { rawQuery } from "./rawQuery";

function _openCypherFetch(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  options?: ExplorerRequestOptions
) {
  return async (queryTemplate: string) => {
    logger.debug(queryTemplate);
    return fetchDatabaseRequest(
      connection,
      featureFlags,
      `${connection.url}/openCypher`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: queryTemplate }),
        ...options,
      }
    );
  };
}

export function createOpenCypherExplorer(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags
): Explorer {
  const remoteLogger = createLoggerFromConnection(connection);
  const serviceType = connection.serviceType || DEFAULT_SERVICE_TYPE;
  return {
    connection,
    async fetchSchema(options) {
      remoteLogger.info("[openCypher Explorer] Fetching schema...");
      const summary = await fetchSummary(
        serviceType,
        connection,
        featureFlags,
        options
      );
      return fetchSchema(
        _openCypherFetch(connection, featureFlags, options),
        remoteLogger,
        summary
      );
    },
    async fetchVertexCountsByType(req, options) {
      remoteLogger.info(
        "[openCypher Explorer] Fetching vertex counts by type..."
      );
      return fetchVertexTypeCounts(
        _openCypherFetch(connection, featureFlags, options),
        req
      );
    },
    async fetchNeighbors(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching neighbors...");
      return fetchNeighbors(
        _openCypherFetch(connection, featureFlags, options),
        req
      );
    },
    async fetchNeighborsCount(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching neighbors count...");
      return fetchNeighborsCount(
        _openCypherFetch(connection, featureFlags, options),
        req
      );
    },
    async keywordSearch(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching keyword search...");
      return keywordSearch(
        _openCypherFetch(connection, featureFlags, options),
        req
      );
    },
    async vertexDetails(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching vertex details...");
      return vertexDetails(
        _openCypherFetch(connection, featureFlags, options),
        req
      );
    },
    async edgeDetails(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching edge details...");
      return edgeDetails(
        _openCypherFetch(connection, featureFlags, options),
        req
      );
    },
    async rawQuery(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching raw query...");
      return rawQuery(_openCypherFetch(connection, featureFlags, options), req);
    },
  } satisfies Explorer;
}

async function fetchSummary(
  serviceType: string,
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  options?: RequestInit
) {
  try {
    const endpoint =
      serviceType === DEFAULT_SERVICE_TYPE
        ? `${connection.url}/pg/statistics/summary?mode=detailed`
        : `${connection.url}/summary?mode=detailed`;
    const response = await fetchDatabaseRequest(
      connection,
      featureFlags,
      endpoint,
      {
        method: "GET",
        ...options,
      }
    );

    return (
      (response.payload
        ? (response.payload.graphSummary as GraphSummary)
        : (response.graphSummary as GraphSummary)) || undefined
    );
  } catch (e) {
    if (env.DEV) {
      logger.error("[Summary API]", e);
    }
  }
}
