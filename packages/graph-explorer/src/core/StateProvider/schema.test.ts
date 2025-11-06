import {
  createRandomEdge,
  createRandomEntities,
  createRandomSchema,
  createRandomVertex,
} from "@/utils/testing";
import {
  mapVertexToTypeConfigs,
  mapEdgeToTypeConfig,
  shouldUpdateSchemaFromEntities,
  updateSchemaFromEntities,
  updateSchemaPrefixes,
} from "./schema";
import { createArray, createRandomName } from "@shared/utils/testing";
import type {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "../ConfigurationProvider";
import { createEdge, createVertex, type EntityProperties } from "../entities";
import { LABELS } from "@/utils";

describe("schema", () => {
  describe("mapVertexToTypeConfigs", () => {
    it("should work with vertex", () => {
      const entity = createVertex({
        id: "1",
        types: ["Person", "Manager"],
        attributes: {
          name: "John",
          age: 30,
        },
      });
      const expected: VertexTypeConfig[] = [
        {
          type: "Person",
          attributes: [
            {
              name: "name",
              dataType: "String",
            },
            {
              name: "age",
              dataType: "Number",
            },
          ],
        },
        {
          type: "Manager",
          attributes: [
            {
              name: "name",
              dataType: "String",
            },
            {
              name: "age",
              dataType: "Number",
            },
          ],
        },
      ];
      const result = mapVertexToTypeConfigs(entity);
      expect(result).toStrictEqual(expected);
    });
  });

  describe("mapEdgeToTypeConfig", () => {
    it("should work with edge", () => {
      const entity = createEdge({
        id: "1",
        type: "WORKS_FOR",
        attributes: {
          since: 2020,
        },
        sourceId: "2",
        targetId: "3",
      });
      const expected: EdgeTypeConfig = {
        type: "WORKS_FOR",
        attributes: [
          {
            name: "since",
            dataType: "Number",
          },
        ],
      };
      const result = mapEdgeToTypeConfig(entity);
      expect(result).toStrictEqual(expected);
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

    it("should add missing entities to schema", () => {
      const originalSchema = createRandomSchema();
      const newNodes = createArray(3, () => createRandomVertex());
      const newEdges = createArray(3, () => createRandomEdge());
      const result = updateSchemaFromEntities(
        { vertices: newNodes, edges: newEdges },
        originalSchema
      );

      expect(result).toEqual({
        ...originalSchema,
        vertices: [
          ...originalSchema.vertices,
          ...newNodes.flatMap(mapVertexToTypeConfigs),
        ],
        edges: [...originalSchema.edges, ...newEdges.map(mapEdgeToTypeConfig)],
      });
    });

    it("should merge entities that have duplicate IDs and types but different attributes", () => {
      const originalSchema = createRandomSchema();
      const newNode1 = createRandomVertex();
      const newNode2 = createRandomVertex();
      const newEdge1 = createRandomEdge();
      const newEdge2 = createRandomEdge();
      newNode2.id = newNode1.id;
      newEdge2.id = newEdge1.id;
      newNode2.type = newNode1.type;
      newNode2.types = newNode1.types;
      newEdge2.type = newEdge1.type;

      const result = updateSchemaFromEntities(
        { vertices: [newNode1, newNode2], edges: [newEdge1, newEdge2] },
        originalSchema
      );

      const node1Configs = mapVertexToTypeConfigs(newNode1);
      const node2Configs = mapVertexToTypeConfigs(newNode2);
      const mergedNodeConfigs = node1Configs.map(config1 => ({
        ...config1,
        attributes: [
          ...config1.attributes,
          ...node2Configs.find(c => c.type === config1.type)!.attributes,
        ],
      }));

      expect(result).toEqual({
        ...originalSchema,
        vertices: [...originalSchema.vertices, ...mergedNodeConfigs],
        edges: [
          ...originalSchema.edges,
          {
            ...mapEdgeToTypeConfig(newEdge1),
            attributes: [
              ...mapEdgeToTypeConfig(newEdge1).attributes,
              ...mapEdgeToTypeConfig(newEdge2).attributes,
            ],
          },
        ],
      });
    });

    it("should add missing attributes to schema", () => {
      const originalSchema = createRandomSchema();
      const newNode = createRandomVertex();
      const newEdge = createRandomEdge();
      newNode.type = originalSchema.vertices[0].type;
      newNode.types = [originalSchema.vertices[0].type];
      newEdge.type = originalSchema.edges[0].type;

      const extractedNodeConfigs = mapVertexToTypeConfigs(newNode);
      const extractedEdgeConfig = mapEdgeToTypeConfig(newEdge);

      const result = updateSchemaFromEntities(
        { vertices: [newNode], edges: [newEdge] },
        originalSchema
      );

      expect(result.vertices.flatMap(v => v.attributes)).toEqual(
        expect.arrayContaining([
          ...originalSchema.vertices.flatMap(v => v.attributes),
          ...extractedNodeConfigs.flatMap(c => c.attributes),
        ])
      );

      expect(result.edges.flatMap(v => v.attributes)).toEqual(
        expect.arrayContaining([
          ...originalSchema.edges.flatMap(v => v.attributes),
          ...extractedEdgeConfig.attributes,
        ])
      );
    });

    it("should add vertices with no type to the schema", () => {
      const originalSchema = createRandomSchema();
      originalSchema.vertices = [];
      originalSchema.edges = [];

      const newNodes = createArray(3, () => createRandomVertex()).map(vertex =>
        createVertex({ ...vertex, types: [] })
      );

      const result = updateSchemaFromEntities(
        { vertices: newNodes, edges: [] },
        originalSchema
      );

      const emptyTypeVtConfigs = result.vertices.filter(
        v => v.type === LABELS.MISSING_TYPE
      );
      expect(emptyTypeVtConfigs).toHaveLength(1);
      expect(emptyTypeVtConfigs[0].attributes).toEqual(
        newNodes.flatMap(mapVertexToTypeConfigs).flatMap(n => n.attributes)
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
