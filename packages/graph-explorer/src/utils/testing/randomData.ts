import {
  ArrowStyle,
  AttributeConfig,
  ConnectionWithId,
  createEdge,
  createEdgeId,
  createNewConfigurationId,
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
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
  createRecord,
  randomlyUndefined,
} from "@shared/utils/testing";
import { toNodeMap } from "@/core/StateProvider/nodes";
import { toEdgeMap } from "@/core/StateProvider/edges";
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
  return {
    name: createRandomName("name"),
    displayLabel: createRandomName("displayLabel"),
    ...(dataType && { dataType }),
    ...(hidden && { hidden }),
    ...(searchable && { searchable }),
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
  return { nodes: toNodeMap(nodes), edges: toEdgeMap(edges) };
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
  return { nodes: toNodeMap(nodes), edges: toEdgeMap(edges) };
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
export function createRandomEdge(source: Vertex, target: Vertex) {
  return createEdge({
    id: createRandomEdgeId(),
    type: createRandomName("EdgeType"),
    attributes: createRecord(3, createRandomEntityAttribute),
    source: {
      id: source.id,
      types: source.types,
    },
    target: {
      id: target.id,
      types: target.types,
    },
  });
}

export function createRandomEdgeForRdf(source: Vertex, target: Vertex) {
  const predicate = createRandomUrlString();
  return createEdge({
    id: createRdfEdgeId(source.id, predicate, target.id),
    type: predicate,
    attributes: {},
    source: {
      id: source.id,
      types: source.types,
    },
    target: {
      id: target.id,
      types: target.types,
    },
  });
}

/**
 * Creates a random entity (vertex or edge) attribute.
 * @returns A random entity attribute object.
 */
export function createRandomEntityAttribute() {
  return {
    key: createRandomName("EntityAttribute"),
    value: createRandomBoolean()
      ? createRandomName("StringValue")
      : createRandomInteger(),
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
  const vertexIds = entities.nodes.keys().toArray();
  const edgeIds = entities.edges.keys().toArray();
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
  const vertexIds = entities.nodes.keys().toArray();
  const edgeIds = entities.edges.keys().toArray();
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
  const lineThickness = randomlyUndefined(createRandomInteger(25));
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
    showRecoilStateLogging: createRandomBoolean(),
    showDebugActions: createRandomBoolean(),
    allowLoggingDbQuery: createRandomBoolean(),
    showQueryEditor: createRandomBoolean(),
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
