import {
  ArrowStyle,
  AttributeConfig,
  ConnectionWithId,
  createEdge,
  createEdgeId,
  createNewConfigurationId,
  createPatchedResultEdge,
  createPatchedResultVertex,
  createResultEdge,
  createResultScalar,
  createResultVertex,
  createVertex,
  createVertexId,
  EdgeId,
  EdgePreferences,
  EdgeTypeConfig,
  Entities,
  FeatureFlags,
  LineStyle,
  PrefixTypeConfig,
  RawConfiguration,
  Schema,
  UserStyling,
  Vertex,
  VertexId,
  VertexPreferences,
  VertexTypeConfig,
} from "@/core";
import {
  createArray,
  createRandomBoolean,
  createRandomColor,
  createRandomDate,
  createRandomDouble,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
  createRecord,
  randomlyUndefined,
} from "@shared/utils/testing";
import {
  NeptuneServiceType,
  neptuneServiceTypeOptions,
  QueryEngine,
  queryEngineOptions,
} from "@shared/types";
import {
  createExportedGraph,
  ExportedGraphConnection,
} from "@/modules/GraphViewer/exportedGraph";
import { createRdfEdgeId } from "@/connector/sparql/createRdfEdgeId";

/*

# Developer Note

These helper functions are provided to allow for easier test data creation.

When creating test data you should start with a random object, then set the values
that directly apply to the logic you are testing.

The randomness of all the other values ensures that the logic under test is not 
affected by those values, regardless of what they are.

*/

/**
 * Creates a random AttributeConfig object.
 * @returns A random AttributeConfig object.
 */
export function createRandomAttributeConfig(): AttributeConfig {
  const dataType = randomlyUndefined(createRandomName("dataType"));
  const hidden = randomlyUndefined(createRandomBoolean());
  const searchable = randomlyUndefined(createRandomBoolean());
  const displayLabel = randomlyUndefined(createRandomName("displayLabel"));

  return {
    name: createRandomName("name"),
    ...(displayLabel && { displayLabel }),
    ...(dataType && { dataType }),
    ...(hidden && { hidden }),
    ...(searchable && { searchable }),
  };
}

/**
 * Creates a random AttributeConfig object with a URL as the name.
 * @returns A random AttributeConfig object.
 */
export function createRandomAttributeConfigForRdf(): AttributeConfig {
  return {
    ...createRandomAttributeConfig(),
    name: createRandomUrlString(),
  };
}

/**
 * Creates a random EdgeTypeConfig object.
 * @returns A random EdgeTypeConfig object.
 */
export function createRandomEdgeTypeConfig(): EdgeTypeConfig {
  const displayLabel = randomlyUndefined(createRandomName("displayLabel"));
  const hidden = randomlyUndefined(createRandomBoolean());
  return {
    type: createRandomName("type"),
    attributes: createArray(6, createRandomAttributeConfig),
    ...(displayLabel && { displayLabel }),
    ...(hidden && { hidden }),
    total: createRandomInteger(),
    // style
    lineColor: createRandomColor(),
    lineStyle: createRandomLineStyle(),
    sourceArrowStyle: createRandomArrowStyle(),
    targetArrowStyle: createRandomArrowStyle(),
  };
}

/**
 * Creates a random EdgeTypeConfig object with a URL as the type.
 * @returns A random EdgeTypeConfig object.
 */
export function createRandomEdgeTypeConfigForRdf(): EdgeTypeConfig {
  return {
    ...createRandomEdgeTypeConfig(),
    type: createRandomUrlString(),
    attributes: createArray(6, createRandomAttributeConfigForRdf),
  };
}

/**
 * Creates a random VertexTypeConfig object.
 * @returns A random VertexTypeConfig object.
 */
export function createRandomVertexTypeConfig(): VertexTypeConfig {
  const displayLabel = randomlyUndefined(createRandomName("displayLabel"));
  const hidden = randomlyUndefined(createRandomBoolean());
  return {
    type: createRandomName("type"),
    attributes: createArray(6, createRandomAttributeConfig),
    ...(displayLabel && { displayLabel }),
    ...(hidden && { hidden }),
    total: createRandomInteger(),
    // style
    color: createRandomColor(),
    iconImageType: createRandomName("iconImageType"),
    iconUrl: createRandomUrlString(),
  };
}

/**
 * Creates a random VertexTypeConfig object with a URL as the type.
 * @returns A random VertexTypeConfig object.
 */
export function createRandomVertexTypeConfigForRdf(): VertexTypeConfig {
  return {
    ...createRandomVertexTypeConfig(),
    type: createRandomUrlString(),
    attributes: createArray(6, createRandomAttributeConfigForRdf),
  };
}

export function createRandomPrefixTypeConfig(): PrefixTypeConfig {
  return {
    prefix: createRandomName("prefix"),
    uri: createRandomUrlString(),
  };
}

/**
 * Creates a random schema object.
 * @returns A random Schema object.
 */
export function createRandomSchema(): Schema {
  const edges = createArray(3, createRandomEdgeTypeConfig);
  const vertices = createArray(3, createRandomVertexTypeConfig);
  const schema: Schema = {
    edges,
    vertices,
    totalEdges: edges
      .map(e => e.total ?? 0)
      .reduce((prev, current) => current + prev, 0),
    totalVertices: vertices
      .map(v => v.total ?? 0)
      .reduce((prev, current) => current + prev, 0),
    lastSyncFail: false,
    lastUpdate: new Date(),
    triedToSync: true,
  };
  return schema;
}

/**
 * Creates random entities (nodes and edges).
 * @returns A random Entities object.
 */
export function createRandomEntities(): Entities {
  const nodes = createArray(3, createRandomVertex);
  const edges = [
    createRandomEdge(nodes[0], nodes[1]),
    createRandomEdge(nodes[0], nodes[2]),
    createRandomEdge(nodes[1], nodes[2]),

    // Reverse edges
    createRandomEdge(nodes[1], nodes[0]),
    createRandomEdge(nodes[2], nodes[0]),
    createRandomEdge(nodes[2], nodes[1]),
  ];
  return { vertices: nodes, edges: edges };
}

export function createRandomEntitiesForRdf(): Entities {
  const nodes = createArray(3, createRandomVertexForRdf);
  const edges = [
    createRandomEdgeForRdf(nodes[0], nodes[1]),
    createRandomEdgeForRdf(nodes[0], nodes[2]),
    createRandomEdgeForRdf(nodes[1], nodes[2]),

    // Reverse edges
    createRandomEdgeForRdf(nodes[1], nodes[0]),
    createRandomEdgeForRdf(nodes[2], nodes[0]),
    createRandomEdgeForRdf(nodes[2], nodes[1]),
  ];
  return { vertices: nodes, edges: edges };
}

/** Creates a random vertex ID. */
export function createRandomVertexId(): VertexId {
  return createVertexId(createRandomName("VertexId"));
}

/** Creates a random edge ID. */
export function createRandomEdgeId(): EdgeId {
  return createEdgeId(createRandomName("EdgeId"));
}

/**
 * Creates a random vertex.
 * @returns A random Vertex object.
 */
export function createRandomVertex() {
  const label = createRandomName("VertexType");
  return createVertex({
    id: createRandomVertexId(),
    types: [label],
    attributes: createRecord(3, createRandomEntityAttribute),
  });
}

export function createRandomVertexForRdf() {
  const label = createRandomUrlString();
  return createVertex({
    id: createRandomUrlString(),
    types: [label],
    attributes: createRecord(3, createRandomEntityAttributeForRdf),
  });
}

/**
 * Creates a random edge.
 * @returns A random Edge object.
 */
export function createRandomEdge(source?: Vertex, target?: Vertex) {
  const sourceId = source?.id ?? createRandomVertexId();
  const targetId = target?.id ?? createRandomVertexId();

  return createEdge({
    id: createRandomEdgeId(),
    type: createRandomName("EdgeType"),
    attributes: createRecord(3, createRandomEntityAttribute),
    sourceId,
    targetId,
  });
}

/**
 * Creates a testable vertex with random data and helper functions to generate different vertex shapes.
 *
 * This factory function creates a vertex with random properties and provides methods to transform
 * it into different vertex types (Vertex, ResultVertex, PatchedResultVertex) or convert it to
 * RDF format. This is useful for testing scenarios where you need consistent vertex data across
 * different representations.
 *
 * @returns A testable vertex object with the following properties and methods:
 * - `id`: Random vertex ID (string for PG, URL for RDF)
 * - `types`: Array of random type names
 * - `attributes`: Random attributes object
 * - `withRdfValues()`: Returns a new testable vertex with RDF-compatible values (URL-based IDs and attributes)
 * - `asVertex()`: Returns a core Vertex object
 * - `asFragmentResult(name?)`: Returns a ResultVertex without attributes (fragment)
 * - `asResult(name?)`: Returns a complete ResultVertex with all attributes
 * - `asPatchedResult(name?)`: Returns a PatchedResultVertex
 *
 * @example
 * ```typescript
 * // Create a testable vertex for property graph testing
 * const testVertex = createTestableVertex();
 *
 * // Use as a core vertex
 * const vertex = testVertex.asVertex();
 *
 * // Use as a result vertex with a custom name
 * const resultVertex = testVertex.asResult("Custom Name");
 *
 * // Create RDF version for SPARQL testing
 * const rdfVertex = testVertex.withRdfValues();
 * const rdfResult = rdfVertex.asResult();
 *
 * // Create fragment (no attributes) for partial data scenarios
 * const fragment = testVertex.asFragmentResult("Fragment Name");
 * ```
 */
export function createTestableVertex() {
  const createInternal = (options: { graphType: "pg" | "rdf" }) => {
    const { graphType } = options;
    const id =
      graphType === "pg"
        ? createRandomVertexId()
        : createVertexId(createRandomUrlString());
    const types = createArray(3, createRandomName);
    const attributes =
      graphType === "pg"
        ? createRecord(3, createRandomEntityAttribute)
        : createRecord(3, createRandomEntityAttributeForRdf);

    const coreVertex = {
      id,
      types,
      attributes,
    };

    return {
      ...coreVertex,
      withRdfValues: () => {
        return createInternal({ graphType: "rdf" });
      },
      asVertex: () =>
        createVertex({
          id: coreVertex.id,
          types: coreVertex.types,
          attributes: coreVertex.attributes,
        }),
      asFragmentResult: (name?: string) =>
        createResultVertex({
          id: coreVertex.id,
          name,
          types: coreVertex.types,
        }),
      asResult: (name?: string) =>
        createResultVertex({
          id: coreVertex.id,
          name,
          types: coreVertex.types,
          attributes: coreVertex.attributes,
        }),
      asPatchedResult: (name?: string) =>
        createPatchedResultVertex({
          id: coreVertex.id,
          name,
          types: coreVertex.types,
          attributes: coreVertex.attributes,
        }),
    };
  };

  return createInternal({ graphType: "pg" });
}

/**
 * Creates a testable edge with random data and helper functions to generate different edge shapes.
 *
 * This factory function creates an edge with random properties connecting two testable vertices
 * and provides methods to transform it into different edge types (Edge, ResultEdge, PatchedResultEdge)
 * or convert it to RDF format. The edge maintains consistent relationships between source and target
 * vertices across all transformations.
 *
 * @returns A testable edge object with the following properties and methods:
 * - `id`: Random edge ID (EdgeId for PG, RDF triple ID for RDF)
 * - `type`: Random edge type (string for PG, URL for RDF)
 * - `attributes`: Random attributes object
 * - `source`: TestableVertex representing the source vertex
 * - `target`: TestableVertex representing the target vertex
 * - `withRdfValues()`: Returns a new testable edge with RDF-compatible values and vertices
 * - `withSource(vertex)`: Returns a new testable edge with a different source vertex
 * - `withTarget(vertex)`: Returns a new testable edge with a different target vertex
 * - `asEdge()`: Returns a core Edge object
 * - `asFragmentResult(name?)`: Returns a ResultEdge without attributes (fragment)
 * - `asResult(name?)`: Returns a complete ResultEdge with all attributes
 * - `asPatchedResult(name?)`: Returns a PatchedResultEdge with embedded vertex objects
 *
 * @example
 * ```typescript
 * // Create a testable edge with random vertices
 * const testEdge = createTestableEdge();
 *
 * // Use as a core edge
 * const edge = testEdge.asEdge();
 *
 * // Use as a result edge with a custom name
 * const resultEdge = testEdge.asResult("Custom Edge Name");
 *
 * // Create RDF version for SPARQL testing
 * const rdfEdge = testEdge.withRdfValues();
 * const rdfResult = rdfEdge.asResult();
 *
 * // Use specific vertices
 * const sourceVertex = createTestableVertex();
 * const targetVertex = createTestableVertex();
 * const customEdge = testEdge.withSource(sourceVertex).withTarget(targetVertex);
 *
 * // Create fragment (no attributes) for partial data scenarios
 * const fragment = testEdge.asFragmentResult("Fragment Edge");
 *
 * // Create patched result with embedded vertices (useful for complex queries)
 * const patchedResult = testEdge.asPatchedResult("Patched Edge");
 * ```
 */
export function createTestableEdge() {
  // Factory method that takes a few configurable options
  const createInternal = (options: {
    graphType: "pg" | "rdf";
    source: TestableVertex;
    target: TestableVertex;
  }) => {
    const { graphType, source, target } = options;
    // Graph type specific values
    const type =
      graphType === "pg"
        ? createRandomName("EdgeType")
        : createRandomUrlString();
    const id =
      graphType === "pg"
        ? createRandomEdgeId()
        : createRdfEdgeId(source.id, type, target.id);
    const attributes =
      graphType === "pg"
        ? createRecord(3, createRandomEntityAttribute)
        : createRecord(3, createRandomEntityAttributeForRdf);

    const coreEdge = {
      id,
      type,
      attributes,
      source,
      target,
    };

    return {
      ...coreEdge,
      withRdfValues: () => {
        return createInternal({
          ...options,
          graphType: "rdf",
          source: options.source.withRdfValues(),
          target: options.target.withRdfValues(),
        });
      },
      withSource: (source: TestableVertex) => {
        return createInternal({ ...options, source });
      },
      withTarget: (target: TestableVertex) => {
        return createInternal({ ...options, target });
      },
      asEdge: () =>
        createEdge({
          id: coreEdge.id,
          sourceId: coreEdge.source.id,
          targetId: coreEdge.target.id,
          type: coreEdge.type,
          attributes: coreEdge.attributes,
        }),
      asFragmentResult: (name?: string) =>
        createResultEdge({
          id: coreEdge.id,
          sourceId: coreEdge.source.id,
          targetId: coreEdge.target.id,
          type: coreEdge.type,
          name,
        }),
      asResult: (name?: string) =>
        createResultEdge({
          id: coreEdge.id,
          sourceId: coreEdge.source.id,
          targetId: coreEdge.target.id,
          type: coreEdge.type,
          attributes: coreEdge.attributes,
          name,
        }),
      asPatchedResult: (name?: string) =>
        createPatchedResultEdge({
          id: coreEdge.id,
          type: coreEdge.type,
          attributes: coreEdge.attributes,
          sourceVertex: coreEdge.source.asVertex(),
          targetVertex: coreEdge.target.asVertex(),
          name,
        }),
    };
  };

  // Use some default values for the initial create
  return createInternal({
    graphType: "pg",
    source: createTestableVertex(),
    target: createTestableVertex(),
  });
}

export type TestableEdge = ReturnType<typeof createTestableEdge>;
export type TestableVertex = ReturnType<typeof createTestableVertex>;

export function createRandomEdgeForRdf(source: Vertex, target: Vertex) {
  const predicate = createRandomUrlString();
  return createEdge({
    id: createRdfEdgeId(source.id, predicate, target.id),
    type: predicate,
    attributes: {},
    sourceId: source.id,
    targetId: target.id,
  });
}

/**
 * Creates a random entity (vertex or edge) attribute.
 * @returns A random entity attribute object.
 */
export function createRandomEntityAttribute() {
  const valueTypes = ["string", "number", "boolean"];
  const valueType = pickRandomElement(valueTypes);
  const value = (() => {
    switch (valueType) {
      case "string":
        return createRandomName("StringValue");
      case "number":
        return createRandomInteger();
      case "boolean":
        return createRandomBoolean();
      default:
        return createRandomName("StringValue");
    }
  })();

  return {
    key: createRandomName("EntityAttribute"),
    value,
  };
}

export function createRandomEntityAttributeForRdf() {
  return {
    key: createRandomUrlString(),
    value: createRandomBoolean()
      ? createRandomName("StringValue")
      : createRandomInteger(),
  };
}

function pickRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function createRandomExportedGraphConnection(): ExportedGraphConnection {
  const dbUrl = createRandomUrlString();
  const queryEngine = createRandomQueryEngine();
  return {
    dbUrl,
    queryEngine,
  };
}

export function createRandomVersion(): string {
  return `${createRandomInteger()}.${createRandomInteger()}.${createRandomInteger()}`;
}

export function createRandomExportedGraph() {
  const entities = createRandomEntities();
  const vertexIds = entities.vertices.map(v => v.id);
  const edgeIds = entities.edges.map(e => e.id);
  const connection = createRandomConnectionWithId();
  connection.queryEngine = pickRandomElement(
    queryEngineOptions.filter(e => e !== "sparql")
  );
  const result = createExportedGraph(vertexIds, edgeIds, connection);
  result.meta.sourceVersion = createRandomVersion();
  return result;
}

export function createRandomExportedGraphForRdf() {
  const entities = createRandomEntitiesForRdf();
  const vertexIds = entities.vertices.map(v => v.id);
  const edgeIds = entities.edges.map(e => e.id);
  const connection = createRandomConnectionWithId();
  connection.queryEngine = "sparql";
  const result = createExportedGraph(vertexIds, edgeIds, connection);
  result.meta.sourceVersion = createRandomVersion();
  return result;
}

export function createRandomFile(): File {
  const fileName = createRandomName("File");
  const contentsString = createRandomName("Contents");
  const fileContent = new Blob([contentsString], { type: "text/plain" });
  const file = new File([fileContent], fileName, { type: "text/plain" });
  return file;
}

export function createRandomConnectionWithId(): ConnectionWithId {
  const isProxyConnection = createRandomBoolean();
  const isIamEnabled = createRandomBoolean();
  const fetchTimeoutMs = randomlyUndefined(createRandomInteger());
  const nodeExpansionLimit = randomlyUndefined(createRandomInteger());
  const serviceType = randomlyUndefined(createRandomServiceType());
  const queryEngine = createRandomQueryEngine();

  return {
    id: createNewConfigurationId(),
    displayLabel: createRandomName("displayLabel"),
    url: createRandomUrlString(),
    ...(isProxyConnection && { graphDbUrl: createRandomUrlString() }),
    queryEngine,
    proxyConnection: isProxyConnection,
    ...(isIamEnabled && { awsAuthEnabled: createRandomBoolean() }),
    ...(isIamEnabled && {
      awsRegion: createRandomAwsRegion(),
    }),
    ...(fetchTimeoutMs && { fetchTimeoutMs }),
    ...(nodeExpansionLimit && { nodeExpansionLimit }),
    ...(serviceType && { serviceType }),
  };
}

/**
 * Creates a random RawConfiguration object.
 * @returns A random RawConfiguration object.
 */
export function createRandomRawConfiguration(): RawConfiguration {
  const { id, displayLabel, ...connection } = createRandomConnectionWithId();

  return {
    id,
    displayLabel,
    connection,
  };
}

export function createRandomQueryEngine(): QueryEngine {
  return pickRandomElement([...queryEngineOptions]);
}

export function createRandomServiceType(): NeptuneServiceType {
  return pickRandomElement([...neptuneServiceTypeOptions]);
}

export function createRandomAwsRegion(): string {
  return pickRandomElement(["us-west-1", "us-west-2", "us-east-1"]);
}

export function createRandomVertexPreferences(): VertexPreferences {
  const color = randomlyUndefined(createRandomColor());
  const borderColor = randomlyUndefined(createRandomColor());
  const iconUrl = randomlyUndefined(createRandomUrlString());
  const longDisplayNameAttribute = randomlyUndefined(
    createRandomName("LongDisplayNameAttribute")
  );
  const displayNameAttribute = randomlyUndefined(
    createRandomName("DisplayNameAttribute")
  );
  const displayLabel = randomlyUndefined(createRandomName("DisplayLabel"));
  return {
    type: createRandomName("VertexType"),
    ...(displayLabel && { displayLabel }),
    ...(displayNameAttribute && { displayNameAttribute }),
    ...(longDisplayNameAttribute && { longDisplayNameAttribute }),
    ...(color && { color }),
    ...(borderColor && { borderColor }),
    ...(iconUrl && { iconUrl }),
  };
}

export function createRandomEdgePreferences(): EdgePreferences {
  const displayLabel = randomlyUndefined(createRandomName("DisplayLabel"));
  const displayNameAttribute = randomlyUndefined(
    createRandomName("DisplayNameAttribute")
  );
  const lineColor = randomlyUndefined(createRandomColor());
  const labelColor = randomlyUndefined(createRandomColor());
  const labelBorderColor = randomlyUndefined(createRandomColor());
  const lineThickness = randomlyUndefined(createRandomInteger({ max: 25 }));
  return {
    type: createRandomName("EdgeType"),
    ...(displayLabel && { displayLabel }),
    ...(displayNameAttribute && { displayNameAttribute }),
    ...(lineColor && { lineColor }),
    ...(labelColor && { labelColor }),
    ...(labelBorderColor && { labelBorderColor }),
    ...(lineThickness && { lineThickness }),
  };
}

export function createRandomUserStyling(): UserStyling {
  return {
    vertices: createArray(3, createRandomVertexPreferences),
    edges: createArray(3, createRandomEdgePreferences),
  };
}

export function createRandomFeatureFlags(): FeatureFlags {
  return {
    showDebugActions: createRandomBoolean(),
    allowLoggingDbQuery: createRandomBoolean(),
  };
}

export function createRandomLineStyle(): LineStyle {
  return pickRandomElement(["solid", "dotted", "dashed"]);
}

export function createRandomArrowStyle(): ArrowStyle {
  return pickRandomElement([
    "triangle",
    "triangle-tee",
    "circle-triangle",
    "triangle-cross",
    "triangle-backcurve",
    "tee",
    "vee",
    "square",
    "circle",
    "diamond",
    "none",
  ]);
}

export function createRandomScalarValue() {
  const generators = [
    () => createRandomBoolean(),
    () => createRandomColor(),
    () => createRandomUrlString(),
    () => createRandomInteger(),
    () => createRandomDouble(),
    () => createRandomDate(),
    () => createRandomName(),
    () => createRandomVersion(),
    () => null,
  ];
  const generator = pickRandomElement(generators);
  return generator();
}

export function createRandomeResultScalar() {
  return createResultScalar({
    name: createRandomName("name"),
    value: createRandomScalarValue(),
  });
}
