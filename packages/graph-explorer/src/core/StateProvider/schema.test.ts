import {
  createRandomEdge,
  createRandomEntities,
  createRandomSchema,
  createRandomVertex,
  makeFragment,
} from "@/utils/testing";
import {
  extractConfigFromEntity,
  shouldUpdateSchemaFromEntities,
  updateSchemaFromEntities,
  updateSchemaPrefixes,
} from "./schema";
import { createArray, createRandomName } from "@shared/utils/testing";
import { PrefixTypeConfig } from "../ConfigurationProvider";
import { EntityProperties } from "../entities";

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
        { vertices: [], edges: [] },
        originalSchema
      );

      expect(result).toEqual(originalSchema);
    });

    it("should exclude fragment entities", () => {
      const originalSchema = createRandomSchema();
      const vertex = createRandomVertex();
      const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
      const result = updateSchemaFromEntities(
        { vertices: [makeFragment(vertex)], edges: [makeFragment(edge)] },
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
        { vertices: newNodes, edges: newEdges },
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

    it("should merge entities that have duplicate IDs and types but different attributes", () => {
      const originalSchema = createRandomSchema();
      const newNode1 = createRandomVertex();
      const newNode2 = createRandomVertex();
      const newEdge1 = createRandomEdge(
        createRandomVertex(),
        createRandomVertex()
      );
      const newEdge2 = createRandomEdge(
        createRandomVertex(),
        createRandomVertex()
      );
      newNode2.id = newNode1.id;
      newEdge2.id = newEdge1.id;
      newNode2.type = newNode1.type;
      newEdge2.type = newEdge1.type;

      const result = updateSchemaFromEntities(
        { vertices: [newNode1, newNode2], edges: [newEdge1, newEdge2] },
        originalSchema
      );

      expect(result).toEqual({
        ...originalSchema,
        vertices: [
          ...originalSchema.vertices,
          {
            ...extractConfigFromEntity(newNode1),
            attributes: [
              ...extractConfigFromEntity(newNode1).attributes,
              ...extractConfigFromEntity(newNode2).attributes,
            ],
          },
        ],
        edges: [
          ...originalSchema.edges,
          {
            ...extractConfigFromEntity(newEdge1),
            attributes: [
              ...extractConfigFromEntity(newEdge1).attributes,
              ...extractConfigFromEntity(newEdge2).attributes,
            ],
          },
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
        { vertices: [newNode], edges: [newEdge] },
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
        { vertices: newNodes, edges: newEdges },
        originalSchema
      );

      const emptyTypeVtConfigs = result.vertices.filter(v => v.type === "");
      expect(emptyTypeVtConfigs).toHaveLength(1);
      expect(emptyTypeVtConfigs[0].attributes).toEqual(
        newNodes.map(extractConfigFromEntity).flatMap(n => n.attributes)
      );

      const emptyTypeEdgeConfigs = result.edges.filter(e => e.type === "");
      expect(emptyTypeEdgeConfigs).toHaveLength(1);
      expect(emptyTypeEdgeConfigs[0].attributes).toEqual(
        newEdges.map(extractConfigFromEntity).flatMap(e => e.attributes)
      );
    });
  });

  describe("updateSchemaPrefixes", () => {
    it("should do nothing when there are no URIs to process", () => {
      const schema = createRandomSchema();
      delete schema.prefixes;
      schema.vertices = [];
      schema.edges = [];

      const result = updateSchemaPrefixes(schema);

      expect(result.prefixes).toBeUndefined();
    });

    it("should generate prefixes for a single URI", () => {
      const schema = createRandomSchema();
      schema.vertices.forEach(v => {
        v.type = "http://abcdefg.com/vertex#" + encodeURIComponent(v.type);
      });
      schema.edges.forEach(e => {
        e.type = "http://abcdefg.com/edge#" + encodeURIComponent(e.type);
      });
      const result = updateSchemaPrefixes(schema);

      expect(result.prefixes).toBeDefined();
      expect(result.prefixes).toEqual([
        {
          prefix: "ver",
          uri: "http://abcdefg.com/vertex#",
          __inferred: true,
          __matches: new Set(schema.vertices.map(v => v.type)),
        },
        {
          prefix: "edg",
          uri: "http://abcdefg.com/edge#",
          __inferred: true,
          __matches: new Set(schema.edges.map(e => e.type)),
        },
      ] satisfies PrefixTypeConfig[]);
    });
  });

  describe("shouldUpdateSchemaFromEntities", () => {
    it("should return false when no entities are provided", () => {
      const result = shouldUpdateSchemaFromEntities(
        { vertices: [], edges: [] },
        createRandomSchema()
      );
      expect(result).toBeFalsy();
    });

    it("should return true when entities are provided", () => {
      const entities = createRandomEntities();
      const result = shouldUpdateSchemaFromEntities(
        entities,
        createRandomSchema()
      );
      expect(result).toBeTruthy();
    });

    it("should return false when the vertex has an existing type", () => {
      const schema = createRandomSchema();
      const vertex = createRandomVertex();
      vertex.type = schema.vertices[0].type;
      vertex.attributes = schema.vertices[0].attributes.reduce((acc, attr) => {
        acc[attr.name] = createRandomName("value");
        return acc;
      }, {} as EntityProperties);
      const result = shouldUpdateSchemaFromEntities(
        {
          vertices: [vertex],
          edges: [],
        },
        schema
      );
      expect(result).toBeFalsy();
    });

    it("should return false when the edge is an existing type", () => {
      const schema = createRandomSchema();
      const source = createRandomVertex();
      const target = createRandomVertex();
      source.type = schema.vertices[0].type;
      source.attributes = schema.vertices[0].attributes.reduce((acc, attr) => {
        acc[attr.name] = createRandomName("value");
        return acc;
      }, {} as EntityProperties);
      target.type = schema.vertices[1].type;
      target.attributes = schema.vertices[1].attributes.reduce((acc, attr) => {
        acc[attr.name] = createRandomName("value");
        return acc;
      }, {} as EntityProperties);
      const edge = createRandomEdge(source, target);
      edge.type = schema.edges[0].type;
      edge.attributes = schema.edges[0].attributes.reduce((acc, attr) => {
        acc[attr.name] = createRandomName("value");
        return acc;
      }, {} as EntityProperties);

      const result = shouldUpdateSchemaFromEntities(
        {
          vertices: [source, target],
          edges: [edge],
        },
        schema
      );
      expect(result).toBeFalsy();
    });
  });
});
