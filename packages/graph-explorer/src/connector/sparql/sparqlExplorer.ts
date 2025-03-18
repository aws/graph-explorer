import type {
  Criterion,
  Explorer,
  ExplorerRequestOptions,
} from "../useGEFetchTypes";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import fetchBlankNodeNeighbors from "./fetchBlankNodeNeighbors";
import fetchClassCounts from "./fetchVertexCountsByType";
import fetchNeighbors from "./fetchNeighbors";
import fetchNeighborsCount from "./fetchNeighborsCount";
import fetchSchema from "./fetchSchema";
import keywordSearch from "./keywordSearch";
import {
  BlankNodesMap,
  GraphSummary,
  SPARQLKeywordSearchRequest,
  SPARQLNeighborsRequest,
} from "./types";
import { ConnectionConfig } from "@shared/types";
import { v4 } from "uuid";
import { env, logger } from "@/utils";
import { createLoggerFromConnection } from "@/core/connector";
import { FeatureFlags } from "@/core";
import { replaceBlankNodeFromNeighbors } from "./fetchNeighbors/replaceBlankNodeFromNeighbors";
import { storedBlankNodeNeighborsRequest } from "./fetchNeighbors/storedBlankNodeNeighborsRequest";
import { replaceBlankNodeFromSearch } from "./keywordSearch/replaceBlankNodeFromSearch";
import { vertexDetails } from "./vertexDetails";
import { edgeDetails } from "./edgeDetails";

function _sparqlFetch(
  connection: ConnectionConfig,
  featureFlags: FeatureFlags,
  options?: ExplorerRequestOptions
) {
  return async (queryTemplate: string) => {
    logger.debug(queryTemplate);
    const body = `query=${encodeURIComponent(queryTemplate)}`;
    const queryId = options?.queryId;
    const headers: Record<string, string> =
      queryId && connection.proxyConnection === true
        ? {
            accept: "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded",
            queryId: queryId,
          }
        : {
            accept: "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded",
          };
    return fetchDatabaseRequest(
      connection,
      featureFlags,
      `${connection.url}/sparql`,
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
      `${connection.url}/rdf/statistics/summary?mode=detailed`,
      {
        method: "GET",
        ...options,
      }
    );

    return (response?.payload?.graphSummary as GraphSummary) || undefined;
  } catch (e) {
    if (env.DEV) {
      logger.error("[Summary API]", e);
    }
  }
}

export function createSparqlExplorer(
  connection: ConnectionConfig,
  featureFlags: FeatureFlags,
  blankNodes: BlankNodesMap
): Explorer {
  const remoteLogger = createLoggerFromConnection(connection);
  return {
    connection: connection,
    async fetchSchema(options) {
      remoteLogger.info("[SPARQL Explorer] Fetching schema...");
      const summary = await fetchSummary(connection, featureFlags, options);
      return fetchSchema(
        _sparqlFetch(connection, featureFlags, options),
        remoteLogger,
        summary
      );
    },
    async fetchVertexCountsByType(req, options) {
      remoteLogger.info("[SPARQL Explorer] Fetching vertex counts by type...");
      return fetchClassCounts(
        _sparqlFetch(connection, featureFlags, options),
        req
      );
    },
    async fetchNeighbors(req, options) {
      remoteLogger.info("[SPARQL Explorer] Fetching neighbors...");
      const request: SPARQLNeighborsRequest = {
        resourceURI: req.vertexId,
        resourceClass: req.vertexTypes.join("::"),
        subjectClasses: req.filterByVertexTypes,
        filterCriteria: req.filterCriteria?.map((c: Criterion) => ({
          predicate: c.name,
          object: c.value,
        })),
        limit: req.limit,
        offset: req.offset,
      };

      const bNode = blankNodes.get(req.vertexId);
      if (bNode?.neighbors) {
        return storedBlankNodeNeighborsRequest(blankNodes, request);
      }

      const response = await fetchNeighbors(
        _sparqlFetch(connection, featureFlags, options),
        request
      );
      const vertices = replaceBlankNodeFromNeighbors(
        blankNodes,
        request,
        response
      );
      return { vertices, edges: response.edges, scalars: [] };
    },
    async fetchNeighborsCount(req, options) {
      remoteLogger.info("[SPARQL Explorer] Fetching neighbors count...");
      const bNode = blankNodes.get(req.vertexId);

      if (bNode?.neighbors) {
        return bNode.neighborCounts;
      }

      if (bNode && !bNode.neighbors) {
        const response = await fetchBlankNodeNeighbors(
          _sparqlFetch(connection, featureFlags, options),
          {
            resourceURI: bNode.vertex.id,
            resourceClass: bNode.vertex.type,
            subQuery: bNode.subQueryTemplate,
          }
        );

        blankNodes.set(req.vertexId, {
          ...bNode,
          neighborCounts: {
            totalCount: response.totalCount,
            counts: response.counts,
          },
          neighbors: response.neighbors,
        });

        return {
          totalCount: response.totalCount,
          counts: response.counts,
        };
      }

      return fetchNeighborsCount(
        _sparqlFetch(connection, featureFlags, options),
        {
          resourceURI: req.vertexId,
          limit: req.limit,
        }
      );
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      remoteLogger.info("[SPARQL Explorer] Fetching keyword search...");

      const reqParams: SPARQLKeywordSearchRequest = {
        searchTerm: req.searchTerm,
        subjectClasses: req.vertexTypes,
        predicates: req.searchByAttributes,
        limit: req.limit,
        offset: req.offset,
        exactMatch: req.exactMatch,
      };

      const response = await keywordSearch(
        _sparqlFetch(connection, featureFlags, options),
        reqParams
      );
      const vertices = replaceBlankNodeFromSearch(
        blankNodes,
        reqParams,
        response
      );

      return { vertices, edges: [], scalars: [] };
    },
    async vertexDetails(req, options) {
      remoteLogger.info("[SPARQL Explorer] Fetching vertex details...");
      return await vertexDetails(
        _sparqlFetch(connection, featureFlags, options),
        req
      );
    },
    async edgeDetails(req, options) {
      remoteLogger.info("[SPARQL Explorer] Fetching edge details...");
      return await edgeDetails(
        _sparqlFetch(connection, featureFlags, options),
        req
      );
    },
  } satisfies Explorer;
}
