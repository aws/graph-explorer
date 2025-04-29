import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  Edge,
  EdgeId,
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  extractConfigFromEntity,
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  RawConfiguration,
  Schema,
  schemaAtom,
  toEdgeMap,
  toNodeMap,
  Vertex,
  VertexId,
} from "@/core";
import {
  createRandomSchema,
  createRandomRawConfiguration,
  createRandomVertex,
  createRandomEdge,
} from "./randomData";
import { JotaiSnapshot } from "./renderHookWithRecoilRoot";

/**
 * Helps build up the state of the Jotai database with common data.
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

  /** Creates a new randome vertex and adds it to the graph. */
  createVertexInGraph() {
    this.addVertexToGraph(createRandomVertex());
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

  /** Creates a new random edge with the given source and target, and adds it to the graph. */
  createEdgeInGraph(source: Vertex, target: Vertex) {
    this.addEdgeToGraph(createRandomEdge(source, target));
  }

  filterEdge(edgeId: EdgeId) {
    this.filteredEdges.add(edgeId);
  }

  filterEdgeType(edgeType: string) {
    this.filteredEdgeTypes.add(edgeType);
  }

  /** Applies the state to the given Jotai snapshot. */
  applyTo(snapshot: JotaiSnapshot) {
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

    // Graph Storage
    snapshot.set(
      allGraphSessionsAtom,
      new Map([
        [
          this.activeConfig.id,
          {
            vertices: new Set(this.vertices.map(v => v.id)),
            edges: new Set(this.edges.map(e => e.id)),
          },
        ],
      ])
    );
  }
}
