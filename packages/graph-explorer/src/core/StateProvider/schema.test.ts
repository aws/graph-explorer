import {
  createRandomEdge,
  createRandomSchema,
  createRandomVertex,
} from "@/utils/testing";
import { extractConfigFromEntity, updateSchemaFromEntities } from "./schema";
import { createArray } from "@shared/utils/testing";
import { toNodeMap } from "./nodes";
import { toEdgeMap } from "./edges";

describe("schema", () => {
  describe("extractConfigFromEntity", () => {
    it("should work with vertex", () => {
      const entity = createRandomVertex();
      const result = extractConfigFromEntity(entity);
      expect(result.type).toEqual(entity.type);
      expect(result.attributes).toHaveLength(
        Object.keys(entity.attributes).length
      );
    });
    it("should work with edge", () => {
      const entity = createRandomEdge(
        createRandomVertex(),
        createRandomVertex()
      );
      const result = extractConfigFromEntity(entity);
      expect(result.type).toEqual(entity.type);
      expect(result.attributes).toHaveLength(
        Object.keys(entity.attributes).length
      );
    });
  });

  describe("updateSchemaFromEntities", () => {
    it("should do nothing when no entities", () => {
      const originalSchema = createRandomSchema();
      const result = updateSchemaFromEntities(
        { nodes: new Map(), edges: new Map() },
        originalSchema
      );

      expect(result).toEqual(originalSchema);
    });

    it("should add missing entities to schema", () => {
      const originalSchema = createRandomSchema();
      const newNodes = createArray(3, () => createRandomVertex());
      const newEdges = createArray(3, () =>
        createRandomEdge(createRandomVertex(), createRandomVertex())
      );
      const result = updateSchemaFromEntities(
        {
          nodes: toNodeMap(newNodes),
          edges: toEdgeMap(newEdges),
        },
        originalSchema
      );

      expect(result).toEqual({
        ...originalSchema,
        vertices: [
          ...originalSchema.vertices,
          ...newNodes.map(extractConfigFromEntity),
        ],
        edges: [
          ...originalSchema.edges,
          ...newEdges.map(extractConfigFromEntity),
        ],
      });
    });

    it("should add missing attributes to schema", () => {
      const originalSchema = createRandomSchema();
      const newNode = createRandomVertex();
      const newEdge = createRandomEdge(
        createRandomVertex(),
        createRandomVertex()
      );
      newNode.type = originalSchema.vertices[0].type;
      newEdge.type = originalSchema.edges[0].type;

      const extractedNodeConfig = extractConfigFromEntity(newNode);
      const extractedEdgeConfig = extractConfigFromEntity(newEdge);

      const result = updateSchemaFromEntities(
        {
          nodes: toNodeMap([newNode]),
          edges: toEdgeMap([newEdge]),
        },
        originalSchema
      );

      expect(result.vertices.flatMap(v => v.attributes)).toEqual(
        expect.arrayContaining([
          ...originalSchema.vertices.flatMap(v => v.attributes),
          ...extractedNodeConfig.attributes,
        ])
      );

      expect(result.edges.flatMap(v => v.attributes)).toEqual(
        expect.arrayContaining([
          ...originalSchema.edges.flatMap(v => v.attributes),
          ...extractedEdgeConfig.attributes,
        ])
      );
    });

    it("should add entities with no type to the schema", () => {
      const originalSchema = createRandomSchema();
      originalSchema.vertices = [];
      originalSchema.edges = [];

      const newNodes = createArray(3, () => createRandomVertex()).map(
        vertex => ({ ...vertex, type: "", types: [] })
      );
      const newEdges = createArray(3, () =>
        createRandomEdge(createRandomVertex(), createRandomVertex())
      ).map(edge => ({ ...edge, type: "" }));

      const result = updateSchemaFromEntities(
        {
          nodes: toNodeMap(newNodes),
          edges: toEdgeMap(newEdges),
        },
        originalSchema
      );

      expect(result).toEqual({
        ...originalSchema,
        vertices: [
          ...originalSchema.vertices,
          ...newNodes.map(extractConfigFromEntity),
        ],
        edges: [
          ...originalSchema.edges,
          ...newEdges.map(extractConfigFromEntity),
        ],
      });
      expect(result.vertices[0].type).toBe("");
      expect(result.edges[0].type).toBe("");
    });
  });
});
