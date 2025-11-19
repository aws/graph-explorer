/* eslint-disable @typescript-eslint/require-await */
import type {
  CountsByTypeResponse,
  EdgeDetailsRequest,
  Explorer,
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
  NeighborsResponse,
  RawQueryResponse,
  VertexDetailsRequest,
} from "@/connector";
import {
  type Edge,
  type Entities,
  normalizeConnection,
  type NormalizedConnection,
  toEdgeMap,
  toNodeMap,
  updateSchemaFromEntities,
  type Vertex,
  type VertexId,
} from "@/core";
import {
  createRandomConnectionWithId,
  type TestableEdge,
  type TestableVertex,
} from "./randomData";

/**
 * An implementation of the Explorer interface that uses local state for results where possible.
 *
 * This is only useful for testing.
 */
export class FakeExplorer implements Explorer {
  connection: NormalizedConnection;
  vertexMap = toNodeMap([]);
  edgeMap = toEdgeMap([]);

  get vertices() {
    return this.vertexMap.values().toArray();
  }

  get edges() {
    return this.edgeMap.values().toArray();
  }

  constructor() {
    this.connection = normalizeConnection(createRandomConnectionWithId());
  }

  addVertex(vertex: Vertex) {
    this.vertexMap.set(vertex.id, vertex);
  }

  addEdge(edge: Edge) {
    this.edgeMap.set(edge.id, edge);
  }

  addTestableVertex(vertex: TestableVertex) {
    this.vertexMap.set(vertex.id, vertex.asVertex());
  }

  addTestableEdge(edge: TestableEdge) {
    this.edgeMap.set(edge.id, edge.asEdge());
    this.vertexMap.set(edge.source.id, edge.source.asVertex());
    this.vertexMap.set(edge.target.id, edge.target.asVertex());
  }

  async fetchSchema() {
    const initialSchema = {
      vertices: [],
      edges: [],
      totalVertices: this.vertices.length,
      totalEdges: this.edges.length,
    };
    const schema = updateSchemaFromEntities(
      { vertices: this.vertices, edges: this.edges },
      initialSchema,
    );

    return schema;
  }

  async fetchVertexCountsByType(): Promise<CountsByTypeResponse> {
    throw new Error("Not implemented");
  }

  async fetchNeighbors(): Promise<NeighborsResponse> {
    throw new Error("Not implemented");
  }

  async neighborCounts(
    request: NeighborCountsRequest,
  ): Promise<NeighborCountsResponse> {
    return {
      counts: request.vertexIds.map(vertexId => {
        const neighbors = this.findNeighbors(vertexId);
        const counts: Record<string, number> = {};
        let totalCount = 0;

        // Count neighbors by type
        neighbors.forEach(neighbor => {
          const neighborType = neighbor.type;
          counts[neighborType] = (counts[neighborType] || 0) + 1;
          totalCount++;
        });

        return {
          vertexId,
          counts,
          totalCount,
        } satisfies NeighborCount;
      }),
    };
  }

  async keywordSearch(): Promise<Entities> {
    throw new Error("Not implemented");
  }

  async vertexDetails(request: VertexDetailsRequest) {
    return {
      vertices: request.vertexIds
        .map(id => this.vertexMap.get(id))
        .filter(v => v != null),
    };
  }

  async edgeDetails(request: EdgeDetailsRequest) {
    return {
      edges: request.edgeIds
        .map(id => this.edgeMap.get(id))
        .filter(v => v != null),
    };
  }

  async rawQuery(): Promise<RawQueryResponse> {
    throw new Error(
      "rawQuery can never have a fake implmentation. Use mocking instead.",
    );
  }

  findNeighbors(vertexId: VertexId) {
    const neighbors = toNodeMap([]);

    for (const edge of this.edges) {
      if (edge.sourceId === vertexId) {
        const neighbor = this.vertexMap.get(edge.targetId);
        if (neighbor) {
          neighbors.set(edge.targetId, neighbor);
        }
      } else if (edge.targetId === vertexId) {
        const neighbor = this.vertexMap.get(edge.sourceId);
        if (neighbor) {
          neighbors.set(edge.sourceId, neighbor);
        }
      }
    }

    return neighbors.values().toArray();
  }
}
