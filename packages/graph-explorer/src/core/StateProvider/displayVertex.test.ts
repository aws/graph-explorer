import {
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  createRandomVertexId,
  createRandomVertexPreferencesStorageModel,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";
import {
  type AppStore,
  createVertex,
  createVertexId,
  type DisplayAttribute,
  getRawId,
  type Schema,
  useDisplayVertexFromVertex,
  type Vertex,
} from "@/core";
import { formatDate, LABELS } from "@/utils";
import { schemaAtom } from "./schema";
import { activeConfigurationAtom, configurationAtom } from "./configuration";
import { createRandomDate, createRandomName } from "@shared/utils/testing";
import type { QueryEngine } from "@shared/types";
import { getDisplayValueForScalar } from "@/connector/entities";

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

  it("should use the display label from user preferences", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    // Schema vertex config
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    vtConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.vertices.push(vtConfig);

    // User vertex preferences
    const userPrefs = createRandomVertexPreferencesStorageModel();
    userPrefs.type = vertex.type;
    userPrefs.displayLabel = createRandomName("userPrefs");
    dbState.activeStyling.vertices?.push(userPrefs);

    const { result } = renderHookWithState(
      () => useDisplayVertexFromVertex(vertex),
      dbState
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
      act(vertex, withSchemaAndConnection(schema, "gremlin")).displayTypes
    ).toStrictEqual(`${vtConfig1.type}, ${vtConfig2.type}`);
  });

  it("should have display types that list all types in sparql", () => {
    const vertex = createRandomVertex();
    vertex.type = "http://www.example.com/class#bar";
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example-class",
        uri: "http://www.example.com/class#",
      },
    ];

    const vtConfig1 = createRandomVertexTypeConfig();
    delete vtConfig1.displayLabel;
    vtConfig1.type = vertex.type;
    schema.vertices.push(vtConfig1);

    const vtConfig2 = createRandomVertexTypeConfig();
    vtConfig2.type = "http://www.example.com/class#baz";
    delete vtConfig2.displayLabel;
    schema.vertices.push(vtConfig2);

    vertex.types = [vtConfig1.type, vtConfig2.type];

    expect(
      act(vertex, withSchemaAndConnection(schema, "sparql")).displayTypes
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
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toStrictEqual(
      formatDate(new Date(vertex.attributes.created as any))
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
      expect.arrayContaining(vtConfig.attributes.map(a => a.name))
    );
  });

  it("should replace uri with prefixes when available", () => {
    const vertex = createRandomVertex();
    vertex.id = createVertexId("http://www.example.com/resources#foo");
    vertex.type = "http://www.example.com/class#bar";
    vertex.types = ["http://www.example.com/class#bar"];
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example",
        uri: "http://www.example.com/resources#",
      },
      {
        prefix: "example-class",
        uri: "http://www.example.com/class#",
      },
    ];

    const displayVertex = act(
      vertex,
      withSchemaAndConnection(schema, "sparql")
    );
    expect(displayVertex.displayId).toStrictEqual("example:foo");
    expect(displayVertex.displayTypes).toStrictEqual("example-class:bar");
  });

  // Helpers

  function act(vertex: Vertex, initializeState?: (store: AppStore) => void) {
    const { result } = renderHookWithJotai(
      () => useDisplayVertexFromVertex(vertex),
      initializeState
    );
    return result.current;
  }

  function withSchema(schema: Schema) {
    const config = createRandomRawConfiguration();
    return (store: AppStore) => {
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(schema: Schema, queryEngine: QueryEngine) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return (store: AppStore) => {
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);
    };
  }
});
