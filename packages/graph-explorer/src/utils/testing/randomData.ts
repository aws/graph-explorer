import { v4 } from "uuid";
import {
  AttributeConfig,
  EdgeTypeConfig,
  Schema,
  VertexTypeConfig,
} from "../../core";

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
  };
}

/**
 * Creates a random schema object.
 * @returns A random Schema object.
 */
export function createRandomSchema(): Schema {
  const edges = createArray(6, createRandomEdgeTypeConfig);
  const vertices = createArray(6, createRandomVertexTypeConfig);
  const schema: Schema = {
    edges,
    vertices,
    totalEdges: edges.length,
    totalVertices: vertices.length,
  };
  return schema;
}
