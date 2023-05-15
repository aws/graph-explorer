import type {
  CountsByTypeRequest,
  CountsByTypeResponse,
  KeywordSearchResponse,
  NeighborsCountRequest,
  NeighborsCountResponse,
  NeighborsRequest,
  NeighborsResponse,
  SchemaResponse,
} from "../AbstractConnector";
import {
  AbstractConnector,
  KeywordSearchRequest,
  QueryOptions,
} from "../AbstractConnector";
import fetchBlankNodeNeighbors from "./queries/fetchBlankNodeNeighbors";
import fetchClassCounts from "./queries/fetchClassCounts";
import fetchNeighbors from "./queries/fetchNeighbors";
import fetchNeighborsCount from "./queries/fetchNeighborsCount";
import fetchSchema from "./queries/fetchSchema";
import keywordSearch from "./queries/keywordSearch";
import keywordSearchBlankNodesIdsTemplate from "./templates/keywordSearch/keywordSearchBlankNodesIdsTemplate";
import oneHopNeighborsBlankNodesIdsTemplate from "./templates/oneHopNeighbors/oneHopNeighborsBlankNodesIdsTemplate";
import { BlankNodesMap, GraphSummary, SPARQLNeighborsRequest } from "./types";

export default class SPARQLConnector extends AbstractConnector {
  protected readonly basePath = "/sparql?query=";
  private readonly _summaryPath = "/rdf/statistics/summary?mode=detailed";

  private _blankNodes: BlankNodesMap = new Map();

  async fetchSchema(options?: QueryOptions): Promise<SchemaResponse> {
    const ops = { ...options, disableCache: true };
    let summary: GraphSummary | undefined;
    try {
      const response = await this.request<{
        payload: { graphSummary: GraphSummary };
      }>(this._summaryPath, ops);
      summary = response.payload.graphSummary;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("[Summary API]", e);
      }
    }

    return fetchSchema(this._sparqlFetch(ops), summary);
  }

  fetchVertexCountsByType(
    req: CountsByTypeRequest,
    options?: QueryOptions
  ): Promise<CountsByTypeResponse> {
    return fetchClassCounts(this._sparqlFetch(options), req);
  }

  async fetchNeighbors(
    req: NeighborsRequest,
    options?: QueryOptions
  ): Promise<NeighborsResponse> {
    const request: SPARQLNeighborsRequest = {
      resourceURI: req.vertexId,
      resourceClass: req.vertexType,
      subjectClasses: req.filterByVertexTypes,
      filterCriteria: req.filterCriteria?.map(c => ({
        predicate: c.name,
        object: c.value,
      })),
      limit: req.limit,
      offset: req.offset,
    };

    const bNode = this._blankNodes.get(req.vertexId);
    if (bNode?.neighbors) {
      return this._storedBlankNodeNeighborsRequest(request);
    }

    const response = await fetchNeighbors(this._sparqlFetch(options), request);
    const vertices = this._replaceBlankNodeFromNeighbors(request, response);
    return { vertices, edges: response.edges };
  }

  async fetchNeighborsCount(
    req: NeighborsCountRequest,
    options?: QueryOptions
  ): Promise<NeighborsCountResponse> {
    const bNode = this._blankNodes.get(req.vertexId);

    if (bNode?.neighbors) {
      return {
        totalCount: bNode.vertex.data.neighborsCount,
        counts: bNode.vertex.data.neighborsCountByType,
      };
    }

    if (bNode && !bNode.neighbors) {
      const response = await fetchBlankNodeNeighbors(
        this._sparqlFetch(options),
        {
          resourceURI: bNode.vertex.data.id,
          resourceClass: bNode.vertex.data.type,
          subQuery: bNode.subQueryTemplate,
        }
      );

      this._blankNodes.set(req.vertexId, {
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

    return fetchNeighborsCount(this._sparqlFetch(options), {
      resourceURI: req.vertexId,
      limit: req.limit,
    });
  }

  async keywordSearch(
    req: KeywordSearchRequest,
    options?: QueryOptions
  ): Promise<KeywordSearchResponse> {
    const reqParams = {
      searchTerm: req.searchTerm,
      subjectClasses: req.vertexTypes,
      predicates: req.searchByAttributes,
      limit: req.limit,
      offset: req.offset,
    };

    const response = await keywordSearch(this._sparqlFetch(options), reqParams);
    const vertices = this._replaceBlankNodeFromSearch(reqParams, response);

    return { vertices };
  }

  private _sparqlFetch<TResult>(options?: QueryOptions) {
    return async (queryTemplate: string) => {
      return super.requestQueryTemplate<TResult>(queryTemplate, {
        signal: options?.abortSignal,
        disableCache: options?.disableCache,
      });
    };
  }

  private _replaceBlankNodeFromSearch(
    request: KeywordSearchRequest,
    response: KeywordSearchResponse
  ) {
    return response.vertices.map(vertex => {
      if (!vertex.data.__isBlank) {
        return vertex;
      }

      const bNode = this._blankNodes.get(vertex.data.id);

      if (!bNode) {
        this._blankNodes.set(vertex.data.id, {
          id: vertex.data.id,
          subQueryTemplate: keywordSearchBlankNodesIdsTemplate(request),
          vertex,
        });
      }

      return bNode?.vertex ?? vertex;
    });
  }

  private _replaceBlankNodeFromNeighbors(
    request: SPARQLNeighborsRequest,
    response: NeighborsResponse
  ) {
    return response.vertices.map(vertex => {
      if (!vertex.data.__isBlank) {
        return vertex;
      }

      const bNode = this._blankNodes.get(vertex.data.id);
      if (!bNode?.neighbors) {
        this._blankNodes.set(vertex.data.id, {
          id: vertex.data.id,
          subQueryTemplate: oneHopNeighborsBlankNodesIdsTemplate(request),
          vertex,
        });
      }

      return bNode?.vertex ?? vertex;
    });
  }

  /**
   * This mock request takes into account the request filtering
   * to narrow the neighbors results of the given blank node.
   */
  private _storedBlankNodeNeighborsRequest(
    req: SPARQLNeighborsRequest
  ): Promise<NeighborsResponse> {
    return new Promise(resolve => {
      const bNode = this._blankNodes.get(req.resourceURI);
      if (!bNode?.neighbors) {
        resolve({
          vertices: [],
          edges: [],
        });
        return;
      }

      const filteredVertices = bNode.neighbors.vertices.filter(vertex => {
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
      });

      resolve({
        vertices: filteredVertices.slice(
          req.offset ?? 0,
          req.limit ? req.limit + (req.offset ?? 0) : undefined
        ),
        edges: bNode.neighbors.edges,
      });
    });
  }
}
