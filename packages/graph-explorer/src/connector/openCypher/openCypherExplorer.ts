import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import fetchSchema from "./queries/fetchSchema";
import { GraphSummary } from "./types";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { ConnectionConfig } from "@shared/types";
import { DEFAULT_SERVICE_TYPE } from "@/utils/constants";
import { Explorer, ExplorerRequestOptions } from "../useGEFetchTypes";
import { env, logger } from "@/utils";
import { createLoggerFromConnection } from "@/core/connector";

function _openCypherFetch(
  connection: ConnectionConfig,
  options?: ExplorerRequestOptions
) {
  return async (queryTemplate: string) => {
    logger.debug(queryTemplate);
    return fetchDatabaseRequest(connection, `${connection.url}/openCypher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: queryTemplate }),
      ...options,
    });
  };
}

export function createOpenCypherExplorer(
  connection: ConnectionConfig
): Explorer {
  const remoteLogger = createLoggerFromConnection(connection);
  const serviceType = connection.serviceType || DEFAULT_SERVICE_TYPE;
  return {
    connection: connection,
    async fetchSchema(options) {
      remoteLogger.info("[openCypher Explorer] Fetching schema...");
      const summary = await fetchSummary(serviceType, connection, options);
      return fetchSchema(_openCypherFetch(connection, options), summary);
    },
    async fetchVertexCountsByType(req, options) {
      remoteLogger.info(
        "[openCypher Explorer] Fetching vertex counts by type..."
      );
      return fetchVertexTypeCounts(_openCypherFetch(connection, options), req);
    },
    async fetchNeighbors(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching neighbors...");
      return fetchNeighbors(_openCypherFetch(connection, options), req);
    },
    async fetchNeighborsCount(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching neighbors count...");
      return fetchNeighborsCount(_openCypherFetch(connection, options), req);
    },
    async keywordSearch(req, options) {
      remoteLogger.info("[openCypher Explorer] Fetching keyword search...");
      return keywordSearch(_openCypherFetch(connection, options), req);
    },
  } satisfies Explorer;
}

async function fetchSummary(
  serviceType: string,
  connection: ConnectionConfig,
  options?: RequestInit
) {
  try {
    const endpoint =
      serviceType === DEFAULT_SERVICE_TYPE
        ? `${connection.url}/pg/statistics/summary?mode=detailed`
        : `${connection.url}/summary?mode=detailed`;
    const response = await fetchDatabaseRequest(connection, endpoint, {
      method: "GET",
      ...options,
    });

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
