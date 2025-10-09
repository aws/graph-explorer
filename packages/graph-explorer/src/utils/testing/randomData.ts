import {
  type ArrowStyle,
  type AttributeConfig,
  type ConnectionWithId,
  createEdge,
  createEdgeId,
  createNewConfigurationId,
  createVertex,
  createVertexId,
  type EdgeId,
  type EdgePreferences,
  type EdgeTypeConfig,
  type Entities,
  type EntityProperties,
  EntityRawId,
  type FeatureFlags,
  type LineStyle,
  type PrefixTypeConfig,
  type RawConfiguration,
  type Schema,
  type UserStyling,
  type Vertex,
  type VertexId,
  type VertexPreferences,
  type VertexTypeConfig,
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
  type NeptuneServiceType,
  neptuneServiceTypeOptions,
  type QueryEngine,
  queryEngineOptions,
} from "@shared/types";
import {
  createExportedGraph,
  type ExportedGraphConnection,
} from "@/modules/GraphViewer/exportedGraph";
import { createRdfEdgeId } from "@/connector/sparql/createRdfEdgeId";
import {
  createResultVertex,
  createPatchedResultVertex,
  createResultEdge,
  createPatchedResultEdge,
  createResultScalar,
} from "@/connector/entities";

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
 * Creates a testable vertex factory with random data and transformation methods.
 *
 * Generates a vertex with random properties that can be transformed into different vertex types
 * (Vertex, ResultVertex, PatchedResultVertex) or converted to RDF format for testing.
 *
 * @returns Testable vertex with methods: withRdfValues(), with(), asVertex(), asFragmentResult(), asResult(), asPatchedResult()
 */
export function createTestableVertex() {
  const createInternal = (testable: {
    id: EntityRawId;
    types: string[];
    attributes: EntityProperties;
    isBlankNode: boolean;
    hasRdfValues?: boolean;
  }) => {
    return {
      ...testable,
      id: createVertexId(testable.id),
      withRdfValues: (
        options?: Partial<Pick<typeof testable, "isBlankNode">>
      ) => {
        if (testable.hasRdfValues === true) {
          // Do nothing if it already has RDF values
          return createInternal(testable);
        }
        return createInternal({
          id: createRandomUrlString() as VertexId,
          types: createArray(3, createRandomUrlString),
          attributes: createRecord(3, createRandomEntityAttributeForRdf),
          isBlankNode: options?.isBlankNode ?? false,
          hasRdfValues: true,
        });
      },
      with: (newTestable: Partial<typeof testable>) => {
        return createInternal({ ...testable, ...newTestable });
      },
      asVertex: () =>
        createVertex({
          id: testable.id,
          types: testable.types,
          attributes: testable.attributes,
          isBlankNode: testable.isBlankNode,
        }),
      asFragmentResult: (name?: string) =>
        createResultVertex({
          id: testable.id,
          name,
          types: testable.types,
          isBlankNode: testable.isBlankNode,
        }),
      asResult: (name?: string) =>
        createResultVertex({
          id: testable.id,
          name,
          types: testable.types,
          attributes: testable.attributes,
          isBlankNode: testable.isBlankNode,
        }),
      asPatchedResult: (name?: string) =>
        createPatchedResultVertex({
          id: testable.id,
          name,
          types: testable.types,
          attributes: testable.attributes,
          isBlankNode: testable.isBlankNode,
        }),
    };
  };

  return createInternal({
    id: createRandomVertexId(),
    types: createArray(3, createRandomName),
    attributes: createRecord(3, createRandomEntityAttribute),
    isBlankNode: false,
  });
}

/**
 * Creates a testable edge factory with random data and transformation methods.
 *
 * Generates an edge with random properties connecting two testable vertices that can be
 * transformed into different edge types (Edge, ResultEdge, PatchedResultEdge) or converted
 * to RDF format for testing. Maintains consistent relationships across transformations.
 *
 * @returns Testable edge with methods: withRdfValues(), with(), withSource(), withTarget(), asEdge(), asFragmentResult(), asResult(), asPatchedResult()
 */
export function createTestableEdge() {
  // Factory method that creates the testable edge
  const createInternal = (testable: {
    id: EntityRawId;
    type: string;
    attributes: EntityProperties;
    source: TestableVertex;
    target: TestableVertex;
  }) => {
    return {
      ...testable,
      id: createEdgeId(testable.id),
      withRdfValues: () => {
        const rdfType = createRandomUrlString();
        const rdfSource = testable.source.withRdfValues();
        const rdfTarget = testable.target.withRdfValues();
        const rdfId = createRdfEdgeId(rdfSource.id, rdfType, rdfTarget.id);
        return createInternal({
          id: rdfId,
          type: rdfType,
          source: rdfSource,
          target: rdfTarget,
          // RDF edge never has attributes
          attributes: {},
        });
      },
      with: (newTestable: Partial<typeof testable>) => {
        return createInternal({ ...testable, ...newTestable });
      },
      withSource: (source: TestableVertex) => {
        return createInternal({ ...testable, source });
      },
      withTarget: (target: TestableVertex) => {
        return createInternal({ ...testable, target });
      },
      asEdge: () =>
        createEdge({
          id: testable.id,
          sourceId: testable.source.id,
          targetId: testable.target.id,
          type: testable.type,
          attributes: testable.attributes,
        }),
      asFragmentResult: (name?: string) =>
        createResultEdge({
          id: testable.id,
          sourceId: testable.source.id,
          targetId: testable.target.id,
          type: testable.type,
          name,
        }),
      asResult: (name?: string) =>
        createResultEdge({
          id: testable.id,
          sourceId: testable.source.id,
          targetId: testable.target.id,
          type: testable.type,
          attributes: testable.attributes,
          name,
        }),
      asPatchedResult: (name?: string) =>
        createPatchedResultEdge({
          id: testable.id,
          type: testable.type,
          attributes: testable.attributes,
          sourceVertex: testable.source.asVertex(),
          targetVertex: testable.target.asVertex(),
          name,
        }),
    };
  };

  // Use default values for a random property graph style edge
  return createInternal({
    id: createRandomEdgeId(),
    type: createRandomName("EdgeType"),
    source: createTestableVertex(),
    target: createTestableVertex(),
    attributes: createRecord(3, createRandomEntityAttribute),
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
  const valueTypes = ["string", "number", "boolean", "date"] as const;
  const randomIndex = Math.floor(Math.random() * valueTypes.length);
  const valueType = valueTypes[randomIndex];
  const value = (() => {
    switch (valueType) {
      case "string":
        return createRandomName("StringValue");
      case "number":
        return createRandomInteger();
      case "boolean":
        return createRandomBoolean();
      case "date":
        return createRandomDate();
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

/**
 * Returnes a random query engine.
 * @param graphType - If "pg" then a random property graph query engine is
 * returned. If "rdf" then "sparql" is returned. If undefined then a random
 * query engine is returned.
 * @returns The query engine.
 */
export function createRandomQueryEngine(graphType?: "pg" | "rdf"): QueryEngine {
  if (graphType === "rdf") {
    return "sparql";
  }
  if (graphType === "pg") {
    return pickRandomElement(["gremlin", "openCypher"]);
  }
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
