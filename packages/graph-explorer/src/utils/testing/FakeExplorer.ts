/* eslint-disable @typescript-eslint/require-await */
import type {
  CountsByTypeResponse,
  EdgeDetailsRequest,
  Explorer,
  NeighborCount,
  NeighborCountsRequest,
  NeighborCountsResponse,
  NeighborsRequest,
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
  type VertexType,
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

  async fetchNeighbors(request: NeighborsRequest): Promise<NeighborsResponse> {
    const { vertexId, excludedVertices, limit = 0 } = request;

    // Find all neighbors connected to the given vertex
    const neighborVertices = toNodeMap([]);
    const neighborEdges = toEdgeMap([]);

    for (const edge of this.edges) {
      let neighborId: VertexId | null = null;

      if (edge.sourceId === vertexId) {
        neighborId = edge.targetId;
      } else if (edge.targetId === vertexId) {
        neighborId = edge.sourceId;
      }

      if (!neighborId) {
        continue;
      }

      // Skip excluded vertices
      if (excludedVertices?.has(neighborId)) {
        continue;
      }

      const neighbor = this.vertexMap.get(neighborId);
      if (neighbor) {
        neighborVertices.set(neighborId, neighbor);
        neighborEdges.set(edge.id, edge);
      }
    }

    // Apply offset and limit
    let vertices = neighborVertices.values().toArray();
    if (limit > 0) {
      vertices = vertices.slice(0, limit);
    }

    // Filter edges to only include those connecting to returned vertices
    const returnedVertexIds = new Set(vertices.map(v => v.id));
    const edges = neighborEdges
      .values()
      .filter(
        e =>
          returnedVertexIds.has(e.sourceId) ||
          returnedVertexIds.has(e.targetId),
      )
      .toArray();

    return { vertices, edges };
  }

  async neighborCounts(
    request: NeighborCountsRequest,
  ): Promise<NeighborCountsResponse> {
    return {
      counts: request.vertexIds.map(vertexId => {
        const neighbors = this.findNeighbors(vertexId);
        const counts = new Map<VertexType, number>();
        let totalCount = 0;

        // Count neighbors by type
        neighbors.forEach(neighbor => {
          const neighborType = neighbor.type;
          counts.set(neighborType, (counts.get(neighborType) ?? 0) + 1);
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
