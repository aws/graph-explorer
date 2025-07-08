/* eslint-disable @typescript-eslint/require-await */
import {
  BulkVertexDetailsRequest,
  CountsByTypeResponse,
  EdgeDetailsRequest,
  Explorer,
  MappedQueryResults,
  NeighborsCountRequest,
  NeighborsCountResponse,
  NeighborsResponse,
  RawQueryResponse,
  VertexDetailsRequest,
} from "@/connector";
import {
  Edge,
  normalizeConnection,
  NormalizedConnection,
  toEdgeMap,
  toNodeMap,
  updateSchemaFromEntities,
  Vertex,
  VertexId,
} from "@/core";
import { createRandomConnectionWithId } from "./randomData";

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

  async fetchSchema() {
    const initialSchema = {
      vertices: [],
      edges: [],
      totalVertices: this.vertices.length,
      totalEdges: this.edges.length,
    };
    const schema = updateSchemaFromEntities(
      {
        nodes: toNodeMap(this.vertices),
        edges: toEdgeMap(this.edges),
      },
      initialSchema
    );

    return schema;
  }

  async fetchVertexCountsByType(): Promise<CountsByTypeResponse> {
    throw new Error("Not implemented");
  }

  async fetchNeighbors(): Promise<NeighborsResponse> {
    throw new Error("Not implemented");
  }

  async fetchNeighborsCount(
    request: NeighborsCountRequest
  ): Promise<NeighborsCountResponse> {
    const neighbors = this.findNeighbors(request.vertexId);
    const counts: Record<string, number> = {};
    let totalCount = 0;

    // Count neighbors by type
    neighbors.forEach(neighbor => {
      const neighborType = neighbor.type;
      counts[neighborType] = (counts[neighborType] || 0) + 1;
      totalCount++;
    });

    return {
      counts,
      totalCount,
    } satisfies NeighborsCountResponse;
  }

  async keywordSearch(): Promise<MappedQueryResults> {
    throw new Error("Not implemented");
  }

  async vertexDetails(request: VertexDetailsRequest) {
    const vertex = this.vertexMap.get(request.vertexId);

    return {
      vertex: vertex ?? null,
    };
  }

  async edgeDetails(request: EdgeDetailsRequest) {
    const edge = this.edgeMap.get(request.edgeId);

    return {
      edge: edge ?? null,
    };
  }

  async rawQuery(): Promise<RawQueryResponse> {
    throw new Error(
      "rawQuery can never have a fake implmentation. Use mocking instead."
    );
  }

  async bulkVertexDetails(request: BulkVertexDetailsRequest) {
    return {
      vertices: request.vertexIds
        .map(id => this.vertexMap.get(id))
        .filter(v => v != null),
    };
  }

  findNeighbors(vertexId: VertexId) {
    return this.edges
      .values()
      .map(edge =>
        edge.source === vertexId
          ? this.vertexMap.get(edge.target)
          : edge.target === vertexId
            ? this.vertexMap.get(edge.source)
            : null
      )
      .filter(n => n != null)
      .toArray();
  }
}
