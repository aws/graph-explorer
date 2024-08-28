import {
  AttributeConfig,
  EdgeTypeConfig,
  RawConfiguration,
  Schema,
  VertexTypeConfig,
} from "@/core";
import { Edge, Vertex } from "@/types/entities";
import { Entities } from "@/core/StateProvider/entitiesSelector";
import {
  createArray,
  createRandomBoolean,
  createRandomInteger,
  createRandomName,
  createRandomUrlString,
  createRecord,
  randomlyUndefined,
} from "@shared/utils/testing";

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
  return {
    name: createRandomName("name"),
    displayLabel: createRandomName("displayLabel"),
    dataType: randomlyUndefined(createRandomName("dataType")),
    hidden: randomlyUndefined(createRandomBoolean()),
    searchable: randomlyUndefined(createRandomBoolean()),
  };
}

/**
 * Creates a random EdgeTypeConfig object.
 * @returns A random EdgeTypeConfig object.
 */
export function createRandomEdgeTypeConfig(): EdgeTypeConfig {
  return {
    type: createRandomName("type"),
    attributes: createArray(6, createRandomAttributeConfig),
    displayLabel: randomlyUndefined(createRandomName("displayLabel")),
    hidden: randomlyUndefined(createRandomBoolean()),
    total: createRandomInteger(),
  };
}

/**
 * Creates a random VertexTypeConfig object.
 * @returns A random VertexTypeConfig object.
 */
export function createRandomVertexTypeConfig(): VertexTypeConfig {
  return {
    type: createRandomName("type"),
    attributes: createArray(6, createRandomAttributeConfig),
    displayLabel: randomlyUndefined(createRandomName("displayLabel")),
    hidden: randomlyUndefined(createRandomBoolean()),
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
  return { nodes, edges };
}

/**
 * Creates a random vertex.
 * @returns A random Vertex object.
 */
export function createRandomVertex(): Vertex {
  return {
    data: {
      id: createRandomName("VertexId"),
      idType: "string",
      type: createRandomName("VertexType"),
      attributes: createRecord(3, createRandomEntityAttribute),
      neighborsCount: 0,
      neighborsCountByType: {},
    },
  };
}

/**
 * Creates a random edge.
 * @returns A random Edge object.
 */
export function createRandomEdge(source: Vertex, target: Vertex): Edge {
  return {
    data: {
      id: createRandomName("EdgeId"),
      type: createRandomName("EdgeType"),
      attributes: createRecord(3, createRandomEntityAttribute),
      source: source.data.id,
      sourceType: source.data.type,
      target: target.data.id,
      targetType: target.data.type,
    },
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
  return {
    id: createRandomName("id"),
    displayLabel: createRandomName("displayLabel"),
    connection: {
      url: createRandomUrlString(),
      graphDbUrl: isProxyConnection ? createRandomUrlString() : undefined,
      queryEngine: pickRandomElement(["gremlin", "openCypher", "sparql"]),
      proxyConnection: isProxyConnection,
      awsAuthEnabled: isIamEnabled ? createRandomBoolean() : undefined,
      awsRegion: isIamEnabled
        ? pickRandomElement(["us-west-1", "us-west-2", "us-east-1"])
        : undefined,
      fetchTimeoutMs: randomlyUndefined(createRandomInteger()),
      nodeExpansionLimit: randomlyUndefined(createRandomInteger()),
      serviceType: pickRandomElement([
        "neptune-db",
        "neptune-graph",
        undefined,
      ]),
    },
  };
}
