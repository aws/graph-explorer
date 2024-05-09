import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchVertexTypeCounts from "./queries/fetchVertexTypeCounts";
import keywordSearch from "./queries/keywordSearch";
import fetchSchema from "./queries/fetchSchema";
import { GraphSummary } from "./types";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { ConnectionConfig } from "../../core";
import { DEFAULT_SERVICE_TYPE } from "../../utils/constants";
import { Explorer } from "../../core/ConnectorProvider/types";

function _openCypherFetch(connection: ConnectionConfig, options: any) {
  return async (queryTemplate: string) => {
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
  const serviceType = connection.serviceType || DEFAULT_SERVICE_TYPE;
  return {
    async fetchSchema(options) {
      let summary;
      try {
        const endpoint =
          serviceType === DEFAULT_SERVICE_TYPE
            ? `${connection.url}/pg/statistics/summary?mode=detailed`
            : `${connection.url}/summary?mode=detailed`;
        const response = await fetchDatabaseRequest(connection, endpoint, {
          method: "GET",
          ...options,
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
      return fetchSchema(_openCypherFetch(connection, options), summary);
    },
    async fetchVertexCountsByType(req, options) {
      return fetchVertexTypeCounts(_openCypherFetch(connection, options), req);
    },
    async fetchNeighbors(req, options) {
      return fetchNeighbors(_openCypherFetch(connection, options), req);
    },
    async fetchNeighborsCount(req, options) {
      return fetchNeighborsCount(_openCypherFetch(connection, options), req);
    },
    async keywordSearch(req, options) {
      return keywordSearch(_openCypherFetch(connection, options), req);
    },
  };
}
