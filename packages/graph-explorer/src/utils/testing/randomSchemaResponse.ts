import {
  type EdgeSchemaResponse,
  type SchemaResponse,
  type VertexSchemaResponse,
} from "@/connector";
import { createRandomAttributeConfig } from "./randomData";
import {
  createArray,
  createRandomName,
  createRandomInteger,
} from "@shared/utils/testing";

/**
 * Creates a random schema response object.
 * @returns A random Schema object.
 */
export function createRandomSchemaResponse(): SchemaResponse {
  const edges = createArray(3, createRandomEdgeTypeConfig);
  const vertices = createArray(3, createRandomVertexTypeConfig);
  const schema: SchemaResponse = {
    edges,
    vertices,
    totalEdges: edges
      .map(e => e.total ?? 0)
      .reduce((prev, current) => current + prev, 0),
    totalVertices: vertices
      .map(v => v.total ?? 0)
      .reduce((prev, current) => current + prev, 0),
  };
  return schema;
}

function createRandomEdgeTypeConfig(): EdgeSchemaResponse {
  return {
    type: createRandomName("type"),
    attributes: createArray(6, createRandomAttributeConfig),
    total: createRandomInteger(),
  };
}

function createRandomVertexTypeConfig(): VertexSchemaResponse {
  return {
    type: createRandomName("type"),
    attributes: createArray(6, createRandomAttributeConfig),
    total: createRandomInteger(),
  };
}
