import {
  AttributeConfig,
  EdgeTypeConfig,
  FeatureFlags,
  RawConfiguration,
  Schema,
  VertexTypeConfig,
} from "@/core";
import { Edge, EdgeId, Vertex, VertexId } from "@/types/entities";
import { Entities } from "@/core/StateProvider/entitiesSelector";
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
import {
  EdgePreferences,
  UserStyling,
  VertexPreferences,
} from "@/core/StateProvider/userPreferences";
import { toNodeMap } from "@/core/StateProvider/nodes";

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
  return { nodes: toNodeMap(nodes), edges };
}

/**
 * Creates a random vertex.
 * @returns A random Vertex object.
 */
export function createRandomVertex(): Vertex {
  return {
    id: createRandomName("VertexId") as VertexId,
    idType: "string",
    type: createRandomName("VertexType"),
    attributes: createRecord(3, createRandomEntityAttribute),
    neighborsCount: 0,
    neighborsCountByType: {},
  };
}

/**
 * Creates a random edge.
 * @returns A random Edge object.
 */
export function createRandomEdge(source: Vertex, target: Vertex): Edge {
  return {
    id: createRandomName("EdgeId") as EdgeId,
    type: createRandomName("EdgeType"),
    attributes: createRecord(3, createRandomEntityAttribute),
    source: source.id,
    sourceType: source.type,
    target: target.id,
    targetType: target.type,
  };
}

/**
 * Creates a random entity (vertex or edge) attribute.
 * @returns A random entity attribute object.
 */
export function createRandomEntityAttribute(): {
  key: string;
  value: string | number;
} {
  return {
    key: createRandomName("EntityAttribute"),
    value: createRandomBoolean()
      ? createRandomName("StringValue")
      : createRandomInteger(),
  };
}

function pickRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Creates a random RawConfiguration object.
 * @returns A random RawConfiguration object.
 */
export function createRandomRawConfiguration(): RawConfiguration {
  const isProxyConnection = createRandomBoolean();
  const isIamEnabled = createRandomBoolean();
  const fetchTimeoutMs = randomlyUndefined(createRandomInteger());
  const nodeExpansionLimit = randomlyUndefined(createRandomInteger());
  const serviceType = randomlyUndefined(
    pickRandomElement(["neptune-db", "neptune-graph"] as const)
  );
  return {
    id: createRandomName("id"),
    displayLabel: createRandomName("displayLabel"),
    connection: {
      url: createRandomUrlString(),
      ...(isProxyConnection && { graphDbUrl: createRandomUrlString() }),
      queryEngine: pickRandomElement(["gremlin", "openCypher", "sparql"]),
      proxyConnection: isProxyConnection,
      ...(isIamEnabled && { awsAuthEnabled: createRandomBoolean() }),
      ...(isIamEnabled && {
        awsRegion: pickRandomElement(["us-west-1", "us-west-2", "us-east-1"]),
      }),
      ...(fetchTimeoutMs && { fetchTimeoutMs }),
      ...(nodeExpansionLimit && { nodeExpansionLimit }),
      ...(serviceType && { serviceType }),
    },
  };
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
  };
}
