import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type Edge,
  type EdgeId,
  type EdgePreferencesStorageModel,
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  explorerForTestingAtom,
  mapVertexToTypeConfigs,
  mapEdgeToTypeConfig,
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  type RawConfiguration,
  type Schema,
  schemaAtom,
  toEdgeMap,
  toNodeMap,
  type UserStyling,
  userStylingAtom,
  type Vertex,
  type VertexId,
  type VertexPreferencesStorageModel,
  type AppStore,
  type EdgeType,
  type VertexType,
} from "@/core";
import {
  createRandomSchema,
  createRandomRawConfiguration,
  createRandomVertex,
  createRandomEdge,
  createRandomUserStyling,
  type TestableEdge,
  type TestableVertex,
} from "./randomData";
import { createMockExplorer } from "./createMockExplorer";
import type { Explorer } from "@/connector";

/**
 * Helps build up the state of the Jotai database with common data.
 */
export class DbState {
  activeSchema: Schema;
  activeConfig: RawConfiguration;
  activeStyling: UserStyling;

  explorer: Explorer;

  vertices: Vertex[] = [];
  filteredVertices: Set<VertexId> = new Set();
  filteredVertexTypes: Set<string> = new Set();

  edges: Edge[] = [];
  filteredEdges: Set<EdgeId> = new Set();
  filteredEdgeTypes: Set<string> = new Set();

  constructor(explorer: Explorer = createMockExplorer()) {
    this.activeSchema = createRandomSchema();

    const config = createRandomRawConfiguration();
    config.schema = this.activeSchema;
    this.activeConfig = config;

    this.activeStyling = createRandomUserStyling();

    this.explorer = explorer;
  }

  /** Adds the vertex to the graph and updates the schema to include the type config. */
  addVertexToGraph(vertex: Vertex) {
    this.vertices.push(vertex);
    this.activeSchema.vertices.push(...mapVertexToTypeConfigs(vertex));
  }

  /** Creates a new randome vertex and adds it to the graph. */
  createVertexInGraph() {
    this.addVertexToGraph(createRandomVertex());
  }

  filterVertex(vertexId: VertexId) {
    this.filteredVertices.add(vertexId);
  }

  filterVertexType(vertexType: VertexType) {
    this.filteredVertexTypes.add(vertexType);
  }

  addEdgeToGraph(edge: Edge) {
    this.edges.push(edge);
    this.activeSchema.edges.push(mapEdgeToTypeConfig(edge));
  }

  addTestableVertexToGraph(vertex: TestableVertex) {
    this.vertices.push(vertex.asVertex());
    this.activeSchema.vertices.push(
      ...mapVertexToTypeConfigs(vertex.asVertex()),
    );
  }

  addTestableEdgeToGraph(edge: TestableEdge) {
    this.edges.push(edge.asEdge());
    this.activeSchema.edges.push(mapEdgeToTypeConfig(edge.asEdge()));
    this.addTestableVertexToGraph(edge.source);
    this.addTestableVertexToGraph(edge.target);
  }

  /** Creates a new random edge with the given source and target, and adds it to the graph. */
  createEdgeInGraph(source: Vertex, target: Vertex) {
    this.addEdgeToGraph(createRandomEdge(source, target));
  }

  filterEdge(edgeId: EdgeId) {
    this.filteredEdges.add(edgeId);
  }

  filterEdgeType(edgeType: EdgeType) {
    this.filteredEdgeTypes.add(edgeType);
  }

  /* User Styling Helpers */

  /**
   * Adds a style configuration for the vertex type to the user styling.
   * @param vertexType The type of the vertex to add the style to.
   * @param style The style configuration to add.
   * @returns The fully composed style configuration.
   */
  addVertexStyle(
    vertexType: VertexType,
    style: Omit<VertexPreferencesStorageModel, "type">,
  ): VertexPreferencesStorageModel {
    const composedStyle = { ...style, type: vertexType };
    const vertices = this.activeStyling.vertices ?? [];
    vertices.push(composedStyle);
    this.activeStyling.vertices = vertices;
    return composedStyle;
  }

  /**
   * Adds a style configuration for the edge type to the user styling.
   * @param edgeType The type of the edge to add the style to.
   * @param style The style configuration to add.
   * @returns The fully composed style configuration.
   */
  addEdgeStyle(
    edgeType: EdgeType,
    style: Omit<EdgePreferencesStorageModel, "type">,
  ): EdgePreferencesStorageModel {
    const composedStyle = { ...style, type: edgeType };
    const edges = this.activeStyling.edges ?? [];
    edges.push(composedStyle);
    this.activeStyling.edges = edges;
    return composedStyle;
  }

  /** Applies the state to the given Jotai store. */
  applyTo(store: AppStore) {
    // Config
    store.set(
      configurationAtom,
      new Map([[this.activeConfig.id, this.activeConfig]]),
    );
    store.set(schemaAtom, new Map([[this.activeConfig.id, this.activeSchema]]));
    store.set(activeConfigurationAtom, this.activeConfig.id);

    // Styling
    store.set(userStylingAtom, this.activeStyling);

    // Vertices
    store.set(nodesAtom, toNodeMap(this.vertices));
    store.set(nodesFilteredIdsAtom, this.filteredVertices);
    store.set(nodesTypesFilteredAtom, this.filteredVertexTypes);

    // Edges
    store.set(edgesAtom, toEdgeMap(this.edges));
    store.set(edgesFilteredIdsAtom, this.filteredEdges);
    store.set(edgesTypesFilteredAtom, this.filteredEdgeTypes);

    // Graph Storage
    store.set(
      allGraphSessionsAtom,
      new Map([
        [
          this.activeConfig.id,
          {
            vertices: new Set(this.vertices.map(v => v.id)),
            edges: new Set(this.edges.map(e => e.id)),
          },
        ],
      ]),
    );

    // Explorer
    store.set(explorerForTestingAtom, this.explorer);
  }
}
