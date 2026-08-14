// @vitest-environment happy-dom
import type { QueryEngine } from "@shared/types";

import { createRandomDate, createRandomName } from "@shared/utils/testing";

import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { getDisplayValueForScalar } from "@/connector/entities";
import {
  activeConfigurationAtom,
  type AppStore,
  configurationAtom,
  createVertex,
  createVertexId,
  createVertexType,
  type DisplayAttribute,
  displayVerticesInCanvasSelector,
  getAppStore,
  getRawId,
  nodesAtom,
  nodesSelectedIdsAtom,
  schemaAtom,
  type SchemaStorageModel,
  toNodeMap,
  useDisplayVertexFromVertex,
  useDisplayVerticesFromVertices,
  useSelectedDisplayVertices,
  type Vertex,
} from "@/core";
import { formatDate, LABELS } from "@/utils";
import {
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  createRandomVertexId,
  createRandomVertexStyleStorage,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

describe("useDisplayVertexFromVertex", () => {
  it("should keep the same ID", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).id).toStrictEqual(vertex.id);
  });

  it("should be a vertex", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).entityType).toStrictEqual("vertex");
  });

  it("should have a display ID equal to the vertex ID", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).displayId).toStrictEqual(getRawId(vertex.id));
  });

  it("should have the display name be the sanitized vertex ID", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).displayName).toStrictEqual(getRawId(vertex.id));
  });

  it("should have the display description be the vertex type", () => {
    const vertex = createRandomVertex();
    expect(act(vertex).displayDescription).toStrictEqual(vertex.type);
  });

  it("should have the display types be missing type label when no types", () => {
    const vertex = createVertex({
      id: createRandomVertexId(),
      types: [],
    });
    expect(act(vertex).displayTypes).toStrictEqual(LABELS.MISSING_TYPE);
  });

  it("should use the display label from user styles", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    // Schema vertex config
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    vtConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.vertices.push(vtConfig);

    // User vertex styles
    const userPrefs = createRandomVertexStyleStorage();
    userPrefs.type = vertex.type;
    userPrefs.displayLabel = createRandomName("userPrefs");
    dbState.vertexStyles.set(userPrefs.type, userPrefs);

    const { result } = renderHookWithState(
      () => useDisplayVertexFromVertex(vertex),
      dbState,
    );

    expect(result.current.displayTypes).toStrictEqual(userPrefs.displayLabel);
  });

  it("should have display types that list all types in gremlin", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();

    const vtConfig1 = createRandomVertexTypeConfig();
    vtConfig1.type = vertex.type;
    schema.vertices.push(vtConfig1);

    const vtConfig2 = createRandomVertexTypeConfig();
    schema.vertices.push(vtConfig2);

    vertex.types = [vtConfig1.type, vtConfig2.type];

    expect(
      act(vertex, withSchemaAndConnection(schema, "gremlin")).displayTypes,
    ).toStrictEqual(`${vtConfig1.type}, ${vtConfig2.type}`);
  });

  it("should have display types that list all types in sparql", () => {
    const vertex = createRandomVertex();
    vertex.type = createVertexType("http://www.example.com/class#bar");
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example-class" as RdfPrefix,
        uri: "http://www.example.com/class#" as IriNamespace,
      },
    ];

    const vtConfig1 = createRandomVertexTypeConfig();
    delete vtConfig1.displayLabel;
    vtConfig1.type = vertex.type;
    schema.vertices.push(vtConfig1);

    const vtConfig2 = createRandomVertexTypeConfig();
    vtConfig2.type = createVertexType("http://www.example.com/class#baz");
    delete vtConfig2.displayLabel;
    schema.vertices.push(vtConfig2);

    vertex.types = [vtConfig1.type, vtConfig2.type];

    expect(
      act(vertex, withSchemaAndConnection(schema, "sparql")).displayTypes,
    ).toStrictEqual(`example-class:bar, example-class:baz`);
  });

  it("should have sorted attributes", () => {
    const vertex = createRandomVertex();
    const attributes: DisplayAttribute[] = Object.entries(vertex.attributes)
      .map(([key, value]) => ({
        name: key,
        displayLabel: key,
        displayValue: getDisplayValueForScalar(value),
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(act(vertex).attributes).toStrictEqual(attributes);
  });

  it("should format date values in attribute", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();

    vertex.attributes = {
      ...vertex.attributes,
      created: createRandomDate(),
    };

    const actualAttribute = act(vertex, withSchema(schema)).attributes.find(
      attr => attr.name === "created",
    );
    expect(actualAttribute?.displayValue).toStrictEqual(
      formatDate(new Date(vertex.attributes.created as any)),
    );
  });

  it("should not add missing attributes from schema config", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    schema.vertices.push(vtConfig);

    const result = act(vertex, withSchema(schema));

    expect(Object.keys(result.attributes)).not.toBe(
      expect.arrayContaining(vtConfig.attributes.map(a => a.name)),
    );
  });

  it("should replace uri with prefixes when available", () => {
    const vertex = createRandomVertex();
    vertex.id = createVertexId("http://www.example.com/resources#foo");
    vertex.type = createVertexType("http://www.example.com/class#bar");
    vertex.types = [createVertexType("http://www.example.com/class#bar")];
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example" as RdfPrefix,
        uri: "http://www.example.com/resources#" as IriNamespace,
      },
      {
        prefix: "example-class" as RdfPrefix,
        uri: "http://www.example.com/class#" as IriNamespace,
      },
    ];

    const displayVertex = act(
      vertex,
      withSchemaAndConnection(schema, "sparql"),
    );
    expect(displayVertex.displayId).toStrictEqual("example:foo");
    expect(displayVertex.displayTypes).toStrictEqual("example-class:bar");
  });

  // Helpers

  function act(vertex: Vertex, initializeState?: (store: AppStore) => void) {
    const { result } = renderHookWithJotai(
      () => useDisplayVertexFromVertex(vertex),
      initializeState,
    );
    return result.current;
  }

  function withSchema(schema: SchemaStorageModel) {
    const config = createRandomRawConfiguration();
    return (store: AppStore) => {
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(
    schema: SchemaStorageModel,
    queryEngine: QueryEngine,
  ) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return (store: AppStore) => {
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);
    };
  }
});

describe("displayVerticesInCanvasSelector", () => {
  it("should map every node in the canvas, keyed by id, in insertion order", () => {
    const store = getAppStore();
    const vertices = [
      createRandomVertex(),
      createRandomVertex(),
      createRandomVertex(),
    ];
    store.set(nodesAtom, toNodeMap(vertices));

    const result = store.get(displayVerticesInCanvasSelector);

    expect(result.keys().toArray()).toStrictEqual(vertices.map(v => v.id));
    for (const vertex of vertices) {
      expect(result.get(vertex.id)?.original).toBe(vertex);
    }
  });

  it("should be empty when the canvas is empty", () => {
    const store = getAppStore();
    expect(store.get(displayVerticesInCanvasSelector).size).toBe(0);
  });

  it("should reflect nodes added and removed across mutations", () => {
    const store = getAppStore();
    const first = createRandomVertex();
    const second = createRandomVertex();

    store.set(nodesAtom, toNodeMap([first]));
    expect(
      store.get(displayVerticesInCanvasSelector).keys().toArray(),
    ).toStrictEqual([first.id]);

    store.set(nodesAtom, toNodeMap([first, second]));
    expect(
      store.get(displayVerticesInCanvasSelector).keys().toArray(),
    ).toStrictEqual([first.id, second.id]);

    store.set(nodesAtom, toNodeMap([second]));
    expect(
      store.get(displayVerticesInCanvasSelector).keys().toArray(),
    ).toStrictEqual([second.id]);
  });

  /**
   * Pins the per-id caching that replaced the array-keyed atom family: an
   * unchanged node must not be re-derived when other nodes are added.
   */
  it("should keep the same DisplayVertex instance for an unchanged node", () => {
    const store = getAppStore();
    const unchanged = createRandomVertex();

    store.set(nodesAtom, toNodeMap([unchanged]));
    const before = store.get(displayVerticesInCanvasSelector).get(unchanged.id);

    store.set(nodesAtom, toNodeMap([unchanged, createRandomVertex()]));
    const after = store.get(displayVerticesInCanvasSelector).get(unchanged.id);

    expect(after).toBe(before);
  });
});

describe("useSelectedDisplayVertices", () => {
  it("should map only the selected nodes", () => {
    const selected = createRandomVertex();
    const notSelected = createRandomVertex();

    const { result } = renderHookWithJotai(
      useSelectedDisplayVertices,
      store => {
        store.set(nodesAtom, toNodeMap([selected, notSelected]));
        store.set(nodesSelectedIdsAtom, new Set([selected.id]));
      },
    );

    expect(result.current.map(v => v.id)).toStrictEqual([selected.id]);
  });

  it("should ignore selected ids that are no longer in the canvas", () => {
    const missing = createRandomVertex();

    const { result } = renderHookWithJotai(
      useSelectedDisplayVertices,
      store => {
        store.set(nodesSelectedIdsAtom, new Set([missing.id]));
      },
    );

    expect(result.current).toStrictEqual([]);
  });
});

describe("useDisplayVerticesFromVertices", () => {
  it("should map arbitrary vertices that are not in the canvas", () => {
    const vertices = [createRandomVertex(), createRandomVertex()];

    const { result } = renderHookWithJotai(() =>
      useDisplayVerticesFromVertices(vertices),
    );

    expect(result.current.keys().toArray()).toStrictEqual(
      vertices.map(v => v.id),
    );
    expect(result.current.get(vertices[0].id)?.original).toBe(vertices[0]);
  });
});
