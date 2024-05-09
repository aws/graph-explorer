import type {
  Criterion,
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
import { ConnectionConfig } from "../../core";
import { v4 } from "uuid";
import { Explorer } from "../../core/ConnectorProvider/types";

const replaceBlankNodeFromSearch = (
  blankNodes: BlankNodesMap,
  request: KeywordSearchRequest,
  response: KeywordSearchResponse
) => {
  return response.vertices.map(vertex => {
    if (!vertex.data.__isBlank) {
      return vertex;
    }

    const bNode = blankNodes.get(vertex.data.id);

    if (!bNode) {
      blankNodes.set(vertex.data.id, {
        id: vertex.data.id,
        subQueryTemplate: keywordSearchBlankNodesIdsTemplate(request),
        vertex,
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
  return response.vertices.map(vertex => {
    if (!vertex.data.__isBlank) {
      return vertex;
    }

    const bNode = blankNodes.get(vertex.data.id);
    if (!bNode?.neighbors) {
      blankNodes.set(vertex.data.id, {
        id: vertex.data.id,
        subQueryTemplate: oneHopNeighborsBlankNodesIdsTemplate(request),
        vertex,
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
      });
      return;
    }

    const filteredVertices = bNode.neighbors.vertices.filter(
      (vertex: { data: { type: any; attributes: { [x: string]: any } } }) => {
        if (!req.subjectClasses && !req.filterCriteria?.length) {
          return true;
        }

        if (!req.subjectClasses?.includes(vertex.data.type)) {
          return false;
        }

        if (!req.filterCriteria?.length) {
          return true;
        }

        for (const criterion of req.filterCriteria) {
          const attrVal = vertex.data.attributes[criterion.predicate];
          if (attrVal == null) {
            return false;
          }
          if (!String(attrVal).match(new RegExp(criterion.object, "gi"))) {
            return false;
          }
        }

        return true;
      }
    );

    resolve({
      vertices: filteredVertices.slice(
        req.offset ?? 0,
        req.limit ? req.limit + (req.offset ?? 0) : undefined
      ),
      edges: bNode.neighbors.edges,
    });
  });
};

function _sparqlFetch(connection: ConnectionConfig | undefined, options?: any) {
  const url = connection?.url;
  return async (queryTemplate: string) => {
    const body = `query=${encodeURIComponent(queryTemplate)}`;
    const headers = options?.queryId
      ? {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          queryId: options.queryId,
        }
      : {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        };
    return fetchDatabaseRequest(connection, `${url}/sparql`, {
      method: "POST",
      headers,
      body,
      ...options,
    });
  };
}

export function createSparqlExplorer(
  connection: ConnectionConfig | undefined,
  blankNodes: BlankNodesMap
): Explorer {
  const url = connection?.url;
  return {
    async fetchSchema(options) {
      let summary;
      try {
        const response = await fetchDatabaseRequest(
          connection,
          `${url}/rdf/statistics/summary?mode=detailed`,
          {
            method: "GET",
            ...options,
          }
        );
        summary = (response.payload.graphSummary as GraphSummary) || undefined;
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error("[Summary API]", e);
        }
      }
      return fetchSchema(_sparqlFetch(connection, options), summary);
    },
    async fetchVertexCountsByType(req, options) {
      return fetchClassCounts(_sparqlFetch(connection, options), req);
    },
    async fetchNeighbors(req, options) {
      const request: SPARQLNeighborsRequest = {
        resourceURI: req.vertexId,
        resourceClass: req.vertexType,
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
        _sparqlFetch(connection, options),
        request
      );
      const vertices = replaceBlankNodeFromNeighbors(
        blankNodes,
        request,
        response
      );
      return { vertices, edges: response.edges };
    },
    async fetchNeighborsCount(req, options) {
      const bNode = blankNodes.get(req.vertexId);

      if (bNode?.neighbors) {
        return {
          totalCount: bNode.vertex.data.neighborsCount,
          counts: bNode.vertex.data.neighborsCountByType,
        };
      }

      if (bNode && !bNode.neighbors) {
        const response = await fetchBlankNodeNeighbors(
          _sparqlFetch(connection, options),
          {
            resourceURI: bNode.vertex.data.id,
            resourceClass: bNode.vertex.data.type,
            subQuery: bNode.subQueryTemplate,
          }
        );

        blankNodes.set(req.vertexId, {
          ...bNode,
          vertex: {
            ...bNode.vertex,
            data: {
              ...bNode.vertex.data,
              neighborsCount: response.totalCount,
              neighborsCountByType: response.counts,
            },
          },
          neighbors: response.neighbors,
        });

        return {
          totalCount: response.totalCount,
          counts: response.counts,
        };
      }

      return fetchNeighborsCount(_sparqlFetch(connection, options), {
        resourceURI: req.vertexId,
        limit: req.limit,
      });
    },
    async keywordSearch(req, options) {
      options ??= {};
      options.queryId = v4();

      const reqParams: SPARQLKeywordSearchRequest = {
        searchTerm: req.searchTerm,
        subjectClasses: req.vertexTypes,
        predicates: req.searchByAttributes,
        limit: req.limit,
        offset: req.offset,
        exactMatch: req.exactMatch,
      };

      const response = await keywordSearch(
        _sparqlFetch(connection, options),
        reqParams
      );
      const vertices = replaceBlankNodeFromSearch(
        blankNodes,
        reqParams,
        response
      );

      return { vertices };
    },
  };
}
