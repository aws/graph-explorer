import {
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  createRandomVertexPreferences,
  createRandomVertexTypeConfig,
  DbState,
  JotaiStore,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";
import {
  createVertexId,
  DisplayAttribute,
  getRawId,
  Schema,
  useDisplayVertexFromVertex,
  Vertex,
} from "@/core";
import { formatDate } from "@/utils";
import { schemaAtom } from "./schema";
import {
  activeConfigurationAtom,
  configurationAtom,
  getDefaultVertexTypeConfig,
  patchToRemoveDisplayLabel,
} from "./configuration";
import { createRandomDate, createRandomName } from "@shared/utils/testing";
import { LABELS } from "@/utils/constants";
import { mapToDisplayVertexTypeConfig } from "./displayTypeConfigs";
import { QueryEngine } from "@shared/types";
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

  it("should have the default type config when vertex type is not in the schema", () => {
    const vertex = createRandomVertex();
    const vtConfig = getDefaultVertexTypeConfig(vertex.type);
    const displayConfig = mapToDisplayVertexTypeConfig(vtConfig, t => t);
    expect(act(vertex).typeConfig).toStrictEqual(displayConfig);
  });

  it("should use the type config from the merged schema", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    dbState.activeSchema.vertices.push(vtConfig);

    const expectedTypeConfig = mapToDisplayVertexTypeConfig(
      patchToRemoveDisplayLabel(vtConfig),
      t => t
    );

    const { result } = renderHookWithState(
      () => useDisplayVertexFromVertex(vertex),
      dbState
    );

    expect(result.current.typeConfig).toStrictEqual(expectedTypeConfig);
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
    const userPrefs = createRandomVertexPreferences();
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

  it("should include missing attributes with --- as value", () => {
    const vertex = createRandomVertex();
    const schema = createRandomSchema();
    const vtConfig = createRandomVertexTypeConfig();
    vtConfig.type = vertex.type;
    schema.vertices.push(vtConfig);
    const configAttributeNames = vtConfig.attributes.map(attr => attr.name);

    const actualAttributesMatchingConfig = act(
      vertex,
      withSchema(schema)
    ).attributes.filter(a => configAttributeNames.includes(a.name));

    const expected = vtConfig.attributes
      .map(
        attr =>
          <DisplayAttribute>{
            name: attr.name,
            displayLabel: attr.name,
            displayValue: LABELS.MISSING_VALUE,
          }
      )
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(actualAttributesMatchingConfig).toStrictEqual(expected);
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

  function act(vertex: Vertex, initializeState?: (store: JotaiStore) => void) {
    const { result } = renderHookWithJotai(
      () => useDisplayVertexFromVertex(vertex),
      initializeState
    );
    return result.current;
  }

  function withSchema(schema: Schema) {
    const config = createRandomRawConfiguration();
    return (store: JotaiStore) => {
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(schema: Schema, queryEngine: QueryEngine) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return (store: JotaiStore) => {
      store.set(configurationAtom, new Map([[config.id, config]]));
      store.set(schemaAtom, new Map([[config.id, schema]]));
      store.set(activeConfigurationAtom, config.id);
    };
  }
});
