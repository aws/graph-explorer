import { v4 } from "uuid";
import {
  AttributeConfig,
  EdgeTypeConfig,
  RawConfiguration,
  Schema,
  VertexTypeConfig,
} from "@/core";
import { Edge, Vertex } from "@/types/entities";
import { Entities } from "@/core/StateProvider/entitiesSelector";

/*

# Developer Note

These helper functions are provided to allow for easier test data creation.

When creating test data you should start with a random object, then set the values
that directly apply to the logic you are testing.

The randomness of all the other values ensures that the logic under test is not 
affected by those values, regardless of what they are.

*/

/**
 * Creates a random string with a prefix, if provided.
 * @param prefix The prefix to prepend to the string.
 * @returns A random string that will resemble "prefix-8d49f0".
 */
export function createRandomName(prefix: string = ""): string {
  return `${prefix}${prefix.length > 0 ? "-" : ""}${v4().substring(0, 6)}`;
}

/**
 * Creates a random boolean.
 * @returns A random boolean value.
 */
export function createRandomBoolean(): boolean {
  return Math.random() < 0.5;
}

/**
 * Creates a random integer.
 * @param max The maximum value the random integer can have. Defaults to 100,000.
 * @returns A random integer value from 0 to the max.
 */
export function createRandomInteger(max: number = 100000): number {
  return Math.floor(Math.random() * max);
}

/**
 * Randomly creates a hex value for an RGB color.
 * @returns The hex string of the random color.
 */
export function createRandomColor(): string {
  const letters = "0123456789ABCDEF".split("");
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}

/**
 * Randomly creates a URL string.
 * @returns The URL string.
 */
export function createRandomUrlString(): string {
  const scheme = pickRandomElement(["http", "https"]);
  const host = createRandomName("host");
  const port = pickRandomElement(["", `:${createRandomInteger(30000)}`]);
  const path = pickRandomElement(["", `/${createRandomName("path")}`]);
  return `${scheme}://${host}${port}${path}`;
}

/**
 * Creates a random date.
 * @param start The lower bound of the random date.
 * @param end The upper bound of the random date.
 * @returns A random `Date` value bound by the given `start` and `end` values.
 */
export function createRandomDate(start?: Date, end?: Date): Date {
  const startTime = start ? start.getTime() : new Date(1970, 0, 1).getTime();
  const endTime = end ? end.getTime() : new Date().getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Randomly returns the provided value or undefined.
 * @returns Either the value or undefined.
 */
export function randomlyUndefined<T>(value: T): T | undefined {
  return createRandomBoolean() ? value : undefined;
}

/**
 * Creates an array containing values generated from the factory function with the given length.
 * @param length The number of items to generate.
 * @param factory A function to generate the desired value.
 * @returns An array with items generated using the factory function.
 */
export function createArray<T>(length: number, factory: () => T): T[] {
  return Array.from({ length }, factory);
}

export function createRecord<TValue>(
  length: number,
  factory: () => { key: string; value: TValue }
): Record<string, TValue> {
  const result: Record<string, TValue> = {};

  for (let i = 0; i < length; i++) {
    const newEntry = factory();
    result[newEntry.key] = newEntry.value;
  }

  return result;
}

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
