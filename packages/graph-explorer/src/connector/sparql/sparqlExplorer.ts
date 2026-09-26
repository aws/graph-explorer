import { v4 } from "uuid";

import type { FeatureFlags, NormalizedConnection } from "@/core";

import { serverLogger } from "@/core/connector";
import { env, logger } from "@/utils";

import type { Explorer, ExplorerRequestOptions } from "../useGEFetchTypes";
import type {
  BlankNodesMap,
  GraphSummary,
  SPARQLKeywordSearchRequest,
  SPARQLNeighborsRequest,
} from "./types";

import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import { edgeDetails } from "./edgeDetails";
import fetchEdgeConnections from "./fetchEdgeConnections";
import fetchNeighbors from "./fetchNeighbors";
import { replaceBlankNodeFromNeighbors } from "./fetchNeighbors/replaceBlankNodeFromNeighbors";
import { storedBlankNodeNeighborsRequest } from "./fetchNeighbors/storedBlankNodeNeighborsRequest";
import fetchSchema from "./fetchSchema";
import fetchClassCounts from "./fetchVertexCountsByType";
import keywordSearch from "./keywordSearch";
import { replaceBlankNodeFromSearch } from "./keywordSearch/replaceBlankNodeFromSearch";
import { neighborCounts } from "./neighborCounts";
import { rawQuery } from "./rawquery";
import { vertexDetails } from "./vertexDetails";

function _sparqlFetch(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  options?: ExplorerRequestOptions,
) {
  return async (queryTemplate: string) => {
    logger.debug(queryTemplate);
    const body = `query=${encodeURIComponent(queryTemplate)}`;
    return fetchDatabaseRequest(connection, featureFlags, "sparql", {
      method: "POST",
      headers: {
        accept: "application/sparql-results+json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      ...options,
    });
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
      "rdf/statistics/summary?mode=basic",
      {
        method: "GET",
        ...options,
      },
    );

    return (response?.payload?.graphSummary as GraphSummary) || undefined;
  } catch (e) {
    if (env.DEV) {
      logger.error("[Summary API]", e);
    }
  }
}

export function createSparqlExplorer(
  connection: NormalizedConnection,
  featureFlags: FeatureFlags,
  blankNodes: BlankNodesMap,
): Explorer {
  return {
    connection: connection,
    async fetchSchema(options) {
      serverLogger.info("[SPARQL Explorer] Fetching schema...");
      const summary = await fetchSummary(connection, featureFlags, options);
      return fetchSchema(
        _sparqlFetch(connection, featureFlags, options),
        serverLogger,
        summary,
      );
    },
    async fetchVertexCountsByType(req, options) {
      serverLogger.info("[SPARQL Explorer] Fetching vertex counts by type...");
      return fetchClassCounts(
        _sparqlFetch(connection, featureFlags, options),
        req,
      );
    },
    async fetchNeighbors(req, options) {
      serverLogger.info("[SPARQL Explorer] Fetching neighbors...");
      const request: SPARQLNeighborsRequest = {
        resourceURI: req.vertexId,
        subjectClasses: req.filterByVertexTypes,
        attributeFilters: req.attributeFilters,
        excludedVertices: req.excludedVertices,
        limit: req.limit,
      };

      const bNode = blankNodes.get(req.vertexId);
      if (bNode?.neighbors) {
        return storedBlankNodeNeighborsRequest(blankNodes, request);
      }

      const response = await fetchNeighbors(
        _sparqlFetch(connection, featureFlags, options),
        request,
      );
      const vertices = replaceBlankNodeFromNeighbors(
        blankNodes,
        request,
        response,
      );
      return { vertices, edges: response.edges };
    },
    async neighborCounts(req, options) {
      serverLogger.info("[SPARQL Explorer] Fetching neighbor counts...");
      return neighborCounts(
        _sparqlFetch(connection, featureFlags, options),
        req,
        blankNodes,
      );
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      serverLogger.info("[SPARQL Explorer] Fetching keyword search...");

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
        reqParams,
      );
      const vertices = replaceBlankNodeFromSearch(
        blankNodes,
        reqParams,
        response,
      );

      return { vertices };
    },
    async vertexDetails(req, options) {
      serverLogger.info("[SPARQL Explorer] Fetching vertex details...");
      return await vertexDetails(
        _sparqlFetch(connection, featureFlags, options),
        req,
      );
    },
    async edgeDetails(req) {
      return Promise.resolve(edgeDetails(req));
    },
    async rawQuery(req, options) {
      serverLogger.info("[SPARQL Explorer] Fetching raw query...");
      return await rawQuery(
        _sparqlFetch(connection, featureFlags, options),
        req,
      );
    },
    async fetchEdgeConnections(req, options) {
      serverLogger.info("[SPARQL Explorer] Fetching edge connections...");
      return fetchEdgeConnections(
        _sparqlFetch(connection, featureFlags, options),
        req,
      );
    },
  } satisfies Explorer;
}
