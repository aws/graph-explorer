import type {
  Criterion,
  Explorer,
  ExplorerRequestOptions,
  KeywordSearchRequest,
  KeywordSearchResponse,
  NeighborsResponse,
} from "../useGEFetchTypes";
import { fetchDatabaseRequest } from "../fetchDatabaseRequest";
import fetchBlankNodeNeighbors from "./queries/fetchBlankNodeNeighbors";
import fetchClassCounts from "./queries/fetchClassCounts";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import keywordSearch from "./queries/keywordSearch";
import keywordSearchBlankNodesIdsTemplate from "./templates/keywordSearch/keywordSearchBlankNodesIdsTemplate";
import oneHopNeighborsBlankNodesIdsTemplate from "./templates/oneHopNeighbors/oneHopNeighborsBlankNodesIdsTemplate";
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

const replaceBlankNodeFromSearch = (
  blankNodes: BlankNodesMap,
  request: KeywordSearchRequest,
  response: KeywordSearchResponse
) => {
  logger.log(
    "[SPARQL Explorer] Replacing blank node from search with keywordSearchBlankNodesIdsTemplate"
  );
  return response.vertices.map(vertex => {
    if (!vertex.__isBlank) {
      return vertex;
    }

    const bNode = blankNodes.get(vertex.id);

    if (!bNode) {
      blankNodes.set(vertex.id, {
        id: vertex.id,
        subQueryTemplate: keywordSearchBlankNodesIdsTemplate(request),
        vertex,
        neighborCounts: {
          totalCount: 0,
          counts: {},
        },
      });
    }

    return bNode?.vertex ?? vertex;
  });
};

const replaceBlankNodeFromNeighbors = (
  blankNodes: BlankNodesMap,
  request: SPARQLNeighborsRequest,
  response: KeywordSearchResponse
) => {
  logger.log(
    "[SPARQL Explorer] Replacing blank node from search with oneHopNeighborsBlankNodesIdsTemplate"
  );
  return response.vertices.map(vertex => {
    if (!vertex.__isBlank) {
      return vertex;
    }

    const bNode = blankNodes.get(vertex.id);
    if (!bNode?.neighbors) {
      blankNodes.set(vertex.id, {
        id: vertex.id,
        subQueryTemplate: oneHopNeighborsBlankNodesIdsTemplate(request),
        vertex,
        neighborCounts: {
          totalCount: 0,
          counts: {},
        },
      });
    }

    return bNode?.vertex ?? vertex;
  });
};
/**
 * This mock request takes into account the request filtering
 * to narrow the neighbors results of the given blank node.
 */
const storedBlankNodeNeighborsRequest = (
  blankNodes: BlankNodesMap,
  req: SPARQLNeighborsRequest
) => {
  return new Promise<NeighborsResponse>(resolve => {
    const bNode = blankNodes.get(req.resourceURI);
    if (!bNode?.neighbors) {
      resolve({
        vertices: [],
        edges: [],
        scalars: [],
      });
      return;
    }

    const filteredVertices = bNode.neighbors.vertices.filter(vertex => {
      if (!req.subjectClasses && !req.filterCriteria?.length) {
        return true;
      }

      if (!req.subjectClasses?.includes(vertex.type)) {
        return false;
      }

      if (!req.filterCriteria?.length) {
        return true;
      }

      for (const criterion of req.filterCriteria) {
        const attrVal = vertex.attributes[criterion.predicate];
        if (attrVal == null) {
          return false;
        }
        if (!String(attrVal).match(new RegExp(criterion.object, "gi"))) {
          return false;
        }
      }

      return true;
    });

    resolve({
      vertices: filteredVertices.slice(
        req.offset ?? 0,
        req.limit ? req.limit + (req.offset ?? 0) : undefined
      ),
      edges: bNode.neighbors.edges,
      scalars: [],
    });
  });
};

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
        resourceURI: req.vertex.id,
        resourceClass: req.vertexType,
        subjectClasses: req.filterByVertexTypes,
        filterCriteria: req.filterCriteria?.map((c: Criterion) => ({
          predicate: c.name,
          object: c.value,
        })),
        limit: req.limit,
        offset: req.offset,
      };

      const bNode = blankNodes.get(req.vertex.id);
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
      const bNode = blankNodes.get(req.vertex.id);

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

        blankNodes.set(req.vertex.id, {
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
          resourceURI: req.vertex.id,
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
  } satisfies Explorer;
}
