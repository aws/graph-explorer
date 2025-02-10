import {
  Edge,
  EdgeId,
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  toEdgeMap,
  Vertex,
  VertexId,
} from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
  nodesAtom,
  RawConfiguration,
  Schema,
  toNodeMap,
} from "@/core";
import {
  extractConfigFromEntity,
  schemaAtom,
} from "@/core/StateProvider/schema";
import { MutableSnapshot } from "recoil";
import { createRandomSchema, createRandomRawConfiguration } from "./randomData";

/**
 * Helps build up the state of the recoil database with common data.
 */
export class DbState {
  activeSchema: Schema;
  activeConfig: RawConfiguration;

  vertices: Vertex[] = [];
  filteredVertices: Set<VertexId> = new Set();
  filteredVertexTypes: Set<string> = new Set();

  edges: Edge[] = [];
  filteredEdges: Set<EdgeId> = new Set();
  filteredEdgeTypes: Set<string> = new Set();

  constructor() {
    this.activeSchema = createRandomSchema();

    const config = createRandomRawConfiguration();
    config.schema = this.activeSchema;
    this.activeConfig = config;
  }

  /** Adds the vertex to the graph and updates the schema to include the type config. */
  addVertexToGraph(vertex: Vertex) {
    this.vertices.push(vertex);
    this.activeSchema.vertices.push(extractConfigFromEntity(vertex));
  }

  filterVertex(vertexId: VertexId) {
    this.filteredVertices.add(vertexId);
  }

  filterVertexType(vertexType: string) {
    this.filteredVertexTypes.add(vertexType);
  }

  addEdgeToGraph(edge: Edge) {
    this.edges.push(edge);
    this.activeSchema.edges.push(extractConfigFromEntity(edge));
  }

  filterEdge(edgeId: EdgeId) {
    this.filteredEdges.add(edgeId);
  }

  filterEdgeType(edgeType: string) {
    this.filteredEdgeTypes.add(edgeType);
  }

  /** Applies the state to the given Recoil snapshot. */
  applyTo(snapshot: MutableSnapshot) {
    // Config
    snapshot.set(
      configurationAtom,
      new Map([[this.activeConfig.id, this.activeConfig]])
    );
    snapshot.set(
      schemaAtom,
      new Map([[this.activeConfig.id, this.activeSchema]])
    );
    snapshot.set(activeConfigurationAtom, this.activeConfig.id);

    // Vertices
    snapshot.set(nodesAtom, toNodeMap(this.vertices));
    snapshot.set(nodesFilteredIdsAtom, this.filteredVertices);
    snapshot.set(nodesTypesFilteredAtom, this.filteredVertexTypes);

    // Edges
    snapshot.set(edgesAtom, toEdgeMap(this.edges));
    snapshot.set(edgesFilteredIdsAtom, this.filteredEdges);
    snapshot.set(edgesTypesFilteredAtom, this.filteredEdgeTypes);
  }
}
