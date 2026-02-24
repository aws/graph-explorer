import { createArray, createRandomName } from "@shared/utils/testing";
import { useAtomValue } from "jotai";

import {
  activeConfigurationAtom,
  configurationAtom,
  createEdgeConnectionId,
  schemaAtom,
} from "@/core";
import { LABELS } from "@/utils";
import { type IriNamespace, PrefixLookup, type RdfPrefix } from "@/utils/rdf";
import {
  createRandomEdge,
  createRandomEdgeConnection,
  createRandomEntities,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  createRandomVertexType,
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import type {
  EdgeTypeConfig,
  PrefixTypeConfig,
  VertexTypeConfig,
} from "../ConfigurationProvider";

import {
  createEdge,
  createEdgeType,
  createVertex,
  createVertexType,
  type EntityProperties,
} from "../entities";
import {
  generateSchemaPrefixes,
  mapEdgeToTypeConfig,
  mapVertexToTypeConfigs,
  maybeActiveSchemaAtom,
  type SchemaStorageModel,
  shouldUpdateSchemaFromEntities,
  updateSchemaFromEntities,
  useActiveSchema,
  useGraphSchema,
  useHasActiveSchema,
  useMaybeActiveSchema,
} from "./schema";

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
          type: createVertexType("Person"),
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
          type: createVertexType("Manager"),
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
        type: createEdgeType("WORKS_FOR"),
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
        originalSchema,
      );

      expect(result).toEqual(originalSchema);
    });

    it("should add missing entities to schema", () => {
      const originalSchema = createRandomSchema();
      const newNodes = createArray(3, () => createRandomVertex());
      const newEdges = createArray(3, () => createRandomEdge());
      const result = updateSchemaFromEntities(
        { vertices: newNodes, edges: newEdges },
        originalSchema,
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
        originalSchema,
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
        originalSchema,
      );

      expect(result.vertices.flatMap(v => v.attributes)).toEqual(
        expect.arrayContaining([
          ...originalSchema.vertices.flatMap(v => v.attributes),
          ...extractedNodeConfigs.flatMap(c => c.attributes),
        ]),
      );

      expect(result.edges.flatMap(v => v.attributes)).toEqual(
        expect.arrayContaining([
          ...originalSchema.edges.flatMap(v => v.attributes),
          ...extractedEdgeConfig.attributes,
        ]),
      );
    });

    it("should add vertices with no type to the schema", () => {
      const originalSchema = createRandomSchema();
      originalSchema.vertices = [];
      originalSchema.edges = [];

      const newNodes = createArray(3, () => createRandomVertex()).map(vertex =>
        createVertex({ ...vertex, types: [] }),
      );

      const result = updateSchemaFromEntities(
        { vertices: newNodes, edges: [] },
        originalSchema,
      );

      const emptyTypeVtConfigs = result.vertices.filter(
        v => v.type === LABELS.MISSING_TYPE,
      );
      expect(emptyTypeVtConfigs).toHaveLength(1);
      expect(emptyTypeVtConfigs[0].attributes).toEqual(
        newNodes.flatMap(mapVertexToTypeConfigs).flatMap(n => n.attributes),
      );
    });

    it("should generate prefixes from vertex IDs", () => {
      const schema = createRandomSchema();
      schema.vertices = [];
      schema.edges = [];
      schema.prefixes = [];

      const vertex = createVertex({
        ...createRandomVertex(),
        id: "http://data.nobelprize.org/resource/country/France",
        types: ["http://data.nobelprize.org/class/Country"],
      });

      const result = updateSchemaFromEntities({ vertices: [vertex] }, schema);

      const prefixes = result.prefixes?.map(p => p.prefix);
      expect(prefixes).toContain("country");
    });
  });

  describe("generateSchemaPrefixes", () => {
    it("should return empty when there are no URIs to process", () => {
      const result = generateSchemaPrefixes(
        new Set(),
        PrefixLookup.fromArray([]),
      );

      expect(result).toStrictEqual([]);
    });

    it("should generate prefixes for URIs", () => {
      const iris = new Set([
        "http://abcdefg.com/vertex#Person",
        "http://abcdefg.com/edge#knows",
      ]);

      const result = generateSchemaPrefixes(iris, PrefixLookup.fromArray([]));

      expect(result).toEqual([
        {
          prefix: "vertex" as RdfPrefix,
          uri: "http://abcdefg.com/vertex#" as IriNamespace,
          __inferred: true,
        },
        {
          prefix: "edge" as RdfPrefix,
          uri: "http://abcdefg.com/edge#" as IriNamespace,
          __inferred: true,
        },
      ] satisfies PrefixTypeConfig[]);
    });

    it("should not regenerate prefixes already covered by existing ones", () => {
      const existingPrefix: PrefixTypeConfig = {
        prefix: "custom" as RdfPrefix,
        uri: "http://custom.example.com/" as IriNamespace,
      };

      const result = generateSchemaPrefixes(
        new Set(["http://custom.example.com/Thing"]),
        PrefixLookup.fromArray([existingPrefix]),
      );

      expect(result).toStrictEqual([]);
    });
  });

  describe("shouldUpdateSchemaFromEntities", () => {
    it("should return false when no entities are provided", () => {
      const result = shouldUpdateSchemaFromEntities(
        { vertices: [], edges: [] },
        createRandomSchema(),
      );
      expect(result).toBeFalsy();
    });

    it("should return true when entities are provided", () => {
      const entities = createRandomEntities();
      const result = shouldUpdateSchemaFromEntities(
        entities,
        createRandomSchema(),
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
        schema,
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
        schema,
      );
      expect(result).toBeFalsy();
    });
  });
});

describe("referential integrity", () => {
  it("should preserve schema reference when no changes", () => {
    const schema = createRandomSchema();
    const vertex = createRandomVertex();
    vertex.type = schema.vertices[0].type;
    vertex.types = [schema.vertices[0].type];
    vertex.attributes = schema.vertices[0].attributes.reduce((acc, attr) => {
      acc[attr.name] = createRandomName("value");
      return acc;
    }, {} as EntityProperties);

    const result = updateSchemaFromEntities({ vertices: [vertex] }, schema);

    expect(result).toBe(schema);
  });

  it("should preserve vertex config reference when no changes", () => {
    const schema = createRandomSchema();
    const vertex = createRandomVertex();
    vertex.type = schema.vertices[0].type;
    vertex.types = [schema.vertices[0].type];
    vertex.attributes = schema.vertices[0].attributes.reduce((acc, attr) => {
      acc[attr.name] = createRandomName("value");
      return acc;
    }, {} as EntityProperties);

    const result = updateSchemaFromEntities({ vertices: [vertex] }, schema);

    expect(result.vertices[0]).toBe(schema.vertices[0]);
  });

  it("should preserve edge config reference when no changes", () => {
    const schema = createRandomSchema();
    const edge = createRandomEdge();
    edge.type = schema.edges[0].type;
    edge.attributes = schema.edges[0].attributes.reduce((acc, attr) => {
      acc[attr.name] = createRandomName("value");
      return acc;
    }, {} as EntityProperties);

    const result = updateSchemaFromEntities({ edges: [edge] }, schema);

    expect(result.edges[0]).toBe(schema.edges[0]);
  });

  it("should preserve attributes reference when no changes", () => {
    const schema = createRandomSchema();
    const vertex = createRandomVertex();
    vertex.type = schema.vertices[0].type;
    vertex.types = [schema.vertices[0].type];
    vertex.attributes = schema.vertices[0].attributes.reduce((acc, attr) => {
      acc[attr.name] = createRandomName("value");
      return acc;
    }, {} as EntityProperties);

    const result = updateSchemaFromEntities({ vertices: [vertex] }, schema);

    expect(result.vertices[0].attributes).toBe(schema.vertices[0].attributes);
  });

  it("should create new vertex config when attributes change", () => {
    const schema = createRandomSchema();
    const vertex = createRandomVertex();
    vertex.type = schema.vertices[0].type;
    vertex.types = [schema.vertices[0].type];

    const result = updateSchemaFromEntities({ vertices: [vertex] }, schema);

    expect(result.vertices[0]).not.toBe(schema.vertices[0]);
    expect(result.vertices[0].attributes).not.toBe(
      schema.vertices[0].attributes,
    );
  });

  it("should create new edge config when attributes change", () => {
    const schema = createRandomSchema();
    const edge = createRandomEdge();
    edge.type = schema.edges[0].type;

    const result = updateSchemaFromEntities({ edges: [edge] }, schema);

    expect(result.edges[0]).not.toBe(schema.edges[0]);
    expect(result.edges[0].attributes).not.toBe(schema.edges[0].attributes);
  });
});

describe("useGraphSchema edgeConnections", () => {
  test("should return empty edgeConnections when schema has none", () => {
    const state = new DbState();
    state.activeSchema.edgeConnections = undefined;

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    expect(result.current.edgeConnections.byVertexType.size).toBe(0);
    expect(result.current.edgeConnections.byEdgeConnectionId.size).toBe(0);
  });

  test("should group connections by vertex type", () => {
    const sharedVertexType = createRandomVertexType();
    const conn1 = createRandomEdgeConnection();
    const conn2 = createRandomEdgeConnection();
    conn1.sourceVertexType = sharedVertexType;
    conn2.targetVertexType = sharedVertexType;

    const state = new DbState();
    state.activeSchema.edgeConnections = [conn1, conn2];

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    const connectionsForShared =
      result.current.edgeConnections.byVertexType.get(sharedVertexType);
    expect(connectionsForShared).toStrictEqual([conn1, conn2]);
  });

  test("forVertexType should return connections for a vertex type", () => {
    const vertexType = createRandomVertexType();
    const conn = createRandomEdgeConnection();
    conn.sourceVertexType = vertexType;

    const state = new DbState();
    state.activeSchema.edgeConnections = [conn];

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    expect(
      result.current.edgeConnections.forVertexType(vertexType),
    ).toStrictEqual([conn]);
  });

  test("forVertexType should return empty array for unknown vertex type", () => {
    const state = new DbState();
    state.activeSchema.edgeConnections = [createRandomEdgeConnection()];

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    expect(
      result.current.edgeConnections.forVertexType(createRandomVertexType()),
    ).toStrictEqual([]);
  });

  test("should not duplicate connection when source equals target", () => {
    const vertexType = createRandomVertexType();
    const conn = createRandomEdgeConnection();
    conn.sourceVertexType = vertexType;
    conn.targetVertexType = vertexType;

    const state = new DbState();
    state.activeSchema.edgeConnections = [conn];

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    expect(
      result.current.edgeConnections.forVertexType(vertexType),
    ).toStrictEqual([conn]);
  });

  test("byEdgeConnectionId should map connections by their ID", () => {
    const conn1 = createRandomEdgeConnection();
    const conn2 = createRandomEdgeConnection();
    const state = new DbState();
    state.activeSchema.edgeConnections = [conn1, conn2];

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    expect(result.current.edgeConnections.byEdgeConnectionId.size).toBe(2);
  });

  test("byEdgeConnectionId should allow lookup by ID", () => {
    const conn = createRandomEdgeConnection();
    const id = createEdgeConnectionId(conn);
    const state = new DbState();
    state.activeSchema.edgeConnections = [conn];

    const { result } = renderHookWithState(() => useGraphSchema(), state);

    expect(
      result.current.edgeConnections.byEdgeConnectionId.get(id),
    ).toStrictEqual(conn);
  });
});

describe("useHasActiveSchema", () => {
  test("should return false when schema has no lastUpdate", () => {
    const state = new DbState();
    state.activeSchema.lastUpdate = undefined;

    const { result } = renderHookWithState(() => useHasActiveSchema(), state);

    expect(result.current).toBe(false);
  });

  test("should return true when schema has lastUpdate", () => {
    const state = new DbState();
    state.activeSchema.lastUpdate = new Date();

    const { result } = renderHookWithState(() => useHasActiveSchema(), state);

    expect(result.current).toBe(true);
  });
});

describe("maybeActiveSchemaAtom", () => {
  it("returns undefined when no active configuration exists", () => {
    const { result } = renderHookWithJotai(() =>
      useAtomValue(maybeActiveSchemaAtom),
    );

    expect(result.current).toBeUndefined();
  });

  it("returns undefined when active config has no schema", () => {
    const config = createRandomRawConfiguration();

    const { result } = renderHookWithJotai(
      () => useAtomValue(maybeActiveSchemaAtom),
      store => {
        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(activeConfigurationAtom, config.id);
        store.set(schemaAtom, new Map());
      },
    );

    expect(result.current).toBeUndefined();
  });

  it("returns the schema when one exists", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();

    const { result } = renderHookWithJotai(
      () => useAtomValue(maybeActiveSchemaAtom),
      store => {
        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(activeConfigurationAtom, config.id);
        store.set(schemaAtom, new Map([[config.id, schema]]));
      },
    );

    expect(result.current).toStrictEqual(schema);
  });
});

describe("useMaybeActiveSchema", () => {
  it("returns undefined when no active configuration exists", () => {
    const { result } = renderHookWithJotai(() => useMaybeActiveSchema());

    expect(result.current).toBeUndefined();
  });

  it("returns undefined when active config has no schema", () => {
    const config = createRandomRawConfiguration();

    const { result } = renderHookWithJotai(
      () => useMaybeActiveSchema(),
      store => {
        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(activeConfigurationAtom, config.id);
        store.set(schemaAtom, new Map());
      },
    );

    expect(result.current).toBeUndefined();
  });

  it("returns the schema when one exists", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();

    const { result } = renderHookWithJotai(
      () => useMaybeActiveSchema(),
      store => {
        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(activeConfigurationAtom, config.id);
        store.set(schemaAtom, new Map([[config.id, schema]]));
      },
    );

    expect(result.current).toStrictEqual(schema);
  });
});

describe("useActiveSchema", () => {
  it("returns empty schema when no active configuration exists", () => {
    const { result } = renderHookWithJotai(() => useActiveSchema());

    expect(result.current).toStrictEqual({
      vertices: [],
      edges: [],
      prefixes: [],
    });
  });

  it("returns empty schema when active config has no schema", () => {
    const config = createRandomRawConfiguration();

    const { result } = renderHookWithJotai(
      () => useActiveSchema(),
      store => {
        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(activeConfigurationAtom, config.id);
        store.set(schemaAtom, new Map());
      },
    );

    expect(result.current).toStrictEqual({
      vertices: [],
      edges: [],
      prefixes: [],
    });
  });

  it("returns the schema when one exists", () => {
    const config = createRandomRawConfiguration();
    const schema = createRandomSchema();

    const { result } = renderHookWithJotai(
      () => useActiveSchema(),
      store => {
        store.set(configurationAtom, new Map([[config.id, config]]));
        store.set(activeConfigurationAtom, config.id);
        store.set(schemaAtom, new Map([[config.id, schema]]));
      },
    );

    expect(result.current).toStrictEqual(schema);
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * SchemaStorageModel (including its PrefixTypeConfig[] in `prefixes`) is
 * persisted to IndexedDB via localforage. Older versions stored a `__matches`
 * property (Set<string>) on inferred prefixes. That property has been removed
 * from PrefixTypeConfig, but previously persisted data may still contain it.
 * These tests verify that schema operations continue to work correctly when
 * the schema contains prefixes in the old shape.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been migrated or that the old shape is no longer in the wild.
 */
describe("backward compatibility: legacy __matches on prefixes", () => {
  it("generateSchemaPrefixes should preserve legacy prefixes and append new ones", () => {
    // Simulates a schema loaded from IndexedDB that was persisted before
    // __matches was removed from PrefixTypeConfig.
    const legacyPrefix = {
      prefix: "soccer" as RdfPrefix,
      uri: "http://www.example.com/soccer/ontology/" as IriNamespace,
      __inferred: true,
      __matches: new Set(["http://www.example.com/soccer/ontology/League"]),
    } as PrefixTypeConfig;

    const result = generateSchemaPrefixes(
      new Set(["http://newdomain.com/vertex#Person"]),
      PrefixLookup.fromArray([legacyPrefix]),
    );

    // New prefix should be generated
    expect(result).toStrictEqual([
      {
        prefix: "vertex" as RdfPrefix,
        uri: "http://newdomain.com/vertex#" as IriNamespace,
        __inferred: true,
      },
    ]);
  });

  it("generateSchemaPrefixes should not regenerate prefixes already covered by legacy entries", () => {
    // The legacy prefix covers the same namespace as the IRIs,
    // so no new prefixes should be generated.
    const legacyPrefix = {
      prefix: "soccer" as RdfPrefix,
      uri: "http://www.example.com/soccer/ontology/" as IriNamespace,
      __inferred: true,
      __matches: new Set(["http://www.example.com/soccer/ontology/League"]),
    } as PrefixTypeConfig;

    const result = generateSchemaPrefixes(
      new Set(["http://www.example.com/soccer/ontology/Player"]),
      PrefixLookup.fromArray([legacyPrefix]),
    );

    // No change — the legacy prefix already covers this namespace
    expect(result).toStrictEqual([]);
  });

  it("updateSchemaFromEntities should work with schema containing legacy prefixes", () => {
    const legacyPrefix = {
      prefix: "old" as RdfPrefix,
      uri: "http://old.example.com/" as IriNamespace,
      __inferred: true,
      __matches: new Set(["http://old.example.com/Thing"]),
    } as PrefixTypeConfig;

    const schema: SchemaStorageModel = {
      vertices: [],
      edges: [],
      prefixes: [legacyPrefix],
    };

    const vertex = createVertex({
      id: "http://new.example.com/vertex#1",
      types: ["http://new.example.com/vertex#Person"],
      attributes: {},
    });

    const result = updateSchemaFromEntities({ vertices: [vertex] }, schema);

    // Legacy prefix should be preserved
    expect(result.prefixes?.[0]).toBe(legacyPrefix);
    // New prefix should be appended for the new namespace
    expect(result.prefixes).toHaveLength(2);
    expect(result.prefixes?.[1]).toStrictEqual({
      prefix: "vertex" as RdfPrefix,
      uri: "http://new.example.com/vertex#" as IriNamespace,
      __inferred: true,
    });
  });
});
