import type { Explorer } from "@/connector";
import type { SchemaViewLayout } from "@/core/StateProvider/schemaViewLayoutDefaults";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  type AppStore,
  configurationAtom,
  type Edge,
  type EdgeId,
  type EdgeStyleStorage,
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesTypesFilteredAtom,
  type EdgeType,
  explorerForTestingAtom,
  type GraphViewLayout,
  graphViewLayoutAtom,
  mapEdgeToTypeConfig,
  mapVertexToTypeConfigs,
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesTypesFilteredAtom,
  type RawConfiguration,
  schemaAtom,
  type SchemaStorageModel,
  schemaViewLayoutAtom,
  sharedEdgeStylesAtom,
  sharedVertexStylesAtom,
  toEdgeMap,
  toNodeMap,
  type Vertex,
  type VertexId,
  type VertexStyleStorage,
  userEdgeStylesAtom,
  userVertexStylesAtom,
  type VertexType,
} from "@/core";

import { createMockExplorer } from "./createMockExplorer";
import {
  createRandomEdge,
  createRandomGraphViewLayout,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomSchemaViewLayout,
  createRandomVertex,
  createRandomEdgeStyles,
  createRandomVertexStyles,
  type TestableEdge,
  type TestableVertex,
} from "./randomData";

/**
 * Helps build up the state of the Jotai database with common data.
 */
export class DbState {
  #activeSchema: SchemaStorageModel | null;
  activeConfig: RawConfiguration;
  vertexStyles: Map<VertexType, VertexStyleStorage>;
  edgeStyles: Map<EdgeType, EdgeStyleStorage>;
  sharedVertexStyles: Map<VertexType, VertexStyleStorage>;
  sharedEdgeStyles: Map<EdgeType, EdgeStyleStorage>;
  graphViewLayout: GraphViewLayout;
  schemaViewLayout: SchemaViewLayout;

  explorer: Explorer;

  vertices: Vertex[] = [];
  filteredVertices: Set<VertexId> = new Set();
  filteredVertexTypes: Set<string> = new Set();

  edges: Edge[] = [];
  filteredEdges: Set<EdgeId> = new Set();
  filteredEdgeTypes: Set<string> = new Set();

  constructor(explorer: Explorer = createMockExplorer()) {
    this.#activeSchema = createRandomSchema();

    this.activeConfig = createRandomRawConfiguration();

    this.vertexStyles = createRandomVertexStyles();
    this.edgeStyles = createRandomEdgeStyles();
    this.sharedVertexStyles = createRandomVertexStyles();
    this.sharedEdgeStyles = createRandomEdgeStyles();

    this.graphViewLayout = createRandomGraphViewLayout();
    this.schemaViewLayout = createRandomSchemaViewLayout();

    this.explorer = explorer;
  }

  /**
   * Gets the active schema, asserting it exists.
   * Use this for tests that expect a schema to be present.
   */
  get activeSchema(): SchemaStorageModel {
    if (!this.#activeSchema) {
      throw new Error(
        "activeSchema is null. Use withNoActiveSchema() only when testing the no-schema case.",
      );
    }
    return this.#activeSchema;
  }

  /**
   * Sets the active schema.
   */
  set activeSchema(schema: SchemaStorageModel) {
    this.#activeSchema = schema;
  }

  /** Removes the active schema from the state. */
  withNoActiveSchema() {
    this.#activeSchema = null;
    return this;
  }

  /** Adds the vertex to the graph and updates the schema to include the type config. */
  addVertexToGraph(vertex: Vertex) {
    this.vertices.push(vertex);
    this.#activeSchema?.vertices.push(...mapVertexToTypeConfigs(vertex));
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
    this.#activeSchema?.edges.push(mapEdgeToTypeConfig(edge));
  }

  addTestableVertexToGraph(vertex: TestableVertex) {
    this.vertices.push(vertex.asVertex());
    this.#activeSchema?.vertices.push(
      ...mapVertexToTypeConfigs(vertex.asVertex()),
    );
  }

  addTestableEdgeToGraph(edge: TestableEdge) {
    this.edges.push(edge.asEdge());
    this.#activeSchema?.edges.push(mapEdgeToTypeConfig(edge.asEdge()));
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

  /* User Styles Helpers */

  /**
   * Adds a style configuration for the vertex type to the user styles.
   * @param vertexType The type of the vertex to add the style to.
   * @param style The style configuration to add.
   * @returns The fully composed style configuration.
   */
  addVertexStyle(
    vertexType: VertexType,
    style: Omit<VertexStyleStorage, "type">,
  ): VertexStyleStorage {
    const composedStyle = { ...style, type: vertexType };
    this.vertexStyles.set(vertexType, composedStyle);
    return composedStyle;
  }

  /**
   * Adds a style configuration for the edge type to the user styles.
   * @param edgeType The type of the edge to add the style to.
   * @param style The style configuration to add.
   * @returns The fully composed style configuration.
   */
  addEdgeStyle(
    edgeType: EdgeType,
    style: Omit<EdgeStyleStorage, "type">,
  ): EdgeStyleStorage {
    const composedStyle = { ...style, type: edgeType };
    this.edgeStyles.set(edgeType, composedStyle);
    return composedStyle;
  }

  /* Shared Styles Helpers */

  /**
   * Adds a style configuration for the vertex type to the shared styles.
   * @param vertexType The type of the vertex to add the style to.
   * @param style The style configuration to add.
   * @returns The fully composed style configuration.
   */
  addSharedVertexStyle(
    vertexType: VertexType,
    style: Omit<VertexStyleStorage, "type">,
  ): VertexStyleStorage {
    const composedStyle = { ...style, type: vertexType };
    this.sharedVertexStyles.set(vertexType, composedStyle);
    return composedStyle;
  }

  /**
   * Adds a style configuration for the edge type to the shared styles.
   * @param edgeType The type of the edge to add the style to.
   * @param style The style configuration to add.
   * @returns The fully composed style configuration.
   */
  addSharedEdgeStyle(
    edgeType: EdgeType,
    style: Omit<EdgeStyleStorage, "type">,
  ): EdgeStyleStorage {
    const composedStyle = { ...style, type: edgeType };
    this.sharedEdgeStyles.set(edgeType, composedStyle);
    return composedStyle;
  }

  /* View Layout Helpers */

  /**
   * Sets the graph view layout, replacing the random default. Applied verbatim
   * so callers can seed legacy shapes (cast with `as GraphViewLayout`) to
   * exercise backward-compat handling.
   */
  withGraphViewLayout(layout: GraphViewLayout) {
    this.graphViewLayout = layout;
    return this;
  }

  /**
   * Sets the schema view layout, replacing the random default. Applied verbatim
   * so callers can seed legacy shapes (cast with `as SchemaViewLayout`) to
   * exercise backward-compat handling.
   */
  withSchemaViewLayout(layout: SchemaViewLayout) {
    this.schemaViewLayout = layout;
    return this;
  }

  /** Applies the state to the given Jotai store. */
  applyTo(store: AppStore) {
    // Config
    store.set(
      configurationAtom,
      new Map([[this.activeConfig.id, this.activeConfig]]),
    );
    if (this.#activeSchema) {
      store.set(
        schemaAtom,
        new Map([[this.activeConfig.id, this.#activeSchema]]),
      );
    } else {
      store.set(schemaAtom, new Map());
    }
    store.set(activeConfigurationAtom, this.activeConfig.id);

    // Styling
    store.set(userVertexStylesAtom, this.vertexStyles);
    store.set(userEdgeStylesAtom, this.edgeStyles);
    store.set(sharedVertexStylesAtom, this.sharedVertexStyles);
    store.set(sharedEdgeStylesAtom, this.sharedEdgeStyles);

    // View Layout
    store.set(graphViewLayoutAtom, this.graphViewLayout);
    store.set(schemaViewLayoutAtom, this.schemaViewLayout);

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
