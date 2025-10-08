import { Edge, getRawId } from "@/core";
import {
  createRandomEdge,
  createRandomEdgePreferences,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  DbState,
  JotaiStore,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";
import { useDisplayEdgeFromEdge } from "./displayEdge";
import { formatDate } from "@/utils";
import { createRandomDate, createRandomName } from "@shared/utils/testing";
import { DisplayAttribute } from "./displayAttribute";
import { mapToDisplayEdgeTypeConfig } from "./displayTypeConfigs";
import {
  activeConfigurationAtom,
  configurationAtom,
  getDefaultEdgeTypeConfig,
  patchToRemoveDisplayLabel,
} from "./configuration";
import { Schema } from "../ConfigurationProvider";
import { schemaAtom } from "./schema";
import { QueryEngine } from "@shared/types";
import { getDisplayValueForScalar } from "@/connector/entities";

describe("useDisplayEdgeFromEdge", () => {
  it("should keep the same ID", () => {
    const edge = createRandomEdge();
    expect(act(edge).id).toStrictEqual(edge.id);
  });

  it("should be an edge", () => {
    const edge = createRandomEdge();
    expect(act(edge).entityType).toStrictEqual("edge");
  });

  it("should have a display ID equal to the edge ID", () => {
    const edge = createRandomEdge();
    expect(act(edge).displayId).toStrictEqual(getRawId(edge.id));
  });

  it("should have the display name be the types", () => {
    const edge = createRandomEdge();
    expect(act(edge).displayName).toStrictEqual(edge.type);
  });

  it("should contain the ID of the source and target vertices", () => {
    const edge = createRandomEdge();

    expect(act(edge).sourceId).toStrictEqual(String(edge.sourceId));
    expect(act(edge).targetId).toStrictEqual(String(edge.targetId));
  });

  it("should have display name that matches the attribute value", () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();
    // Get the first attribute
    const attribute = Object.entries(edge.attributes).map(([name, value]) => ({
      name,
      value,
    }))[0];

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayNameAttribute = attribute.name;
    schema.edges.push(etConfig);

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayName
    ).toStrictEqual(getDisplayValueForScalar(attribute.value));
  });

  it("should have display name that matches the types when displayNameAttribute is 'type'", () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayNameAttribute = "type";
    schema.edges.push(etConfig);

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayName
    ).toStrictEqual(edge.type);
  });

  it("should have the default type config when edge type is not in the schema", () => {
    const edge = createRandomEdge();
    const etConfig = getDefaultEdgeTypeConfig(edge.type);
    const displayConfig = mapToDisplayEdgeTypeConfig(etConfig, t => t);
    expect(act(edge).typeConfig).toStrictEqual(displayConfig);
  });

  it("should use the type config from the merged schema", () => {
    const edge = createRandomEdge();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    const schema = createRandomSchema();
    schema.edges.push(etConfig);

    const expectedTypeConfig = mapToDisplayEdgeTypeConfig(
      patchToRemoveDisplayLabel(etConfig),
      t => t
    );

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).typeConfig
    ).toStrictEqual(expectedTypeConfig);
  });

  it("should ignore display label from schema", () => {
    const dbState = new DbState();
    const edge = createRandomEdge();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.edges.push(etConfig);

    const { result } = renderHookWithState(
      () => useDisplayEdgeFromEdge(edge),
      dbState
    );

    expect(result.current.displayTypes).toStrictEqual(edge.type);
  });

  it("should use display label from user preferences", () => {
    const dbState = new DbState();
    const edge = createRandomEdge();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.edges.push(etConfig);

    const edgePrefs = createRandomEdgePreferences();
    edgePrefs.type = edge.type;
    edgePrefs.displayLabel = createRandomName("prefs");
    dbState.activeStyling.edges?.push(edgePrefs);

    const { result } = renderHookWithState(
      () => useDisplayEdgeFromEdge(edge),
      dbState
    );

    expect(result.current.displayTypes).toStrictEqual(edgePrefs.displayLabel);
  });

  it("should have display types that list all types in gremlin", () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayTypes
    ).toStrictEqual(etConfig.type);
  });

  it("should have display types that list all types in sparql", () => {
    const edge = createRandomEdge();
    edge.type = "http://www.example.com/class#bar";
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example-class",
        uri: "http://www.example.com/class#",
      },
    ];

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      act(edge, withSchemaAndConnection(schema, "sparql")).displayTypes
    ).toStrictEqual(`example-class:bar`);
  });

  it("should have sorted attributes", () => {
    const edge = createRandomEdge();
    const attributes: DisplayAttribute[] = Object.entries(edge.attributes)
      .map(([key, value]) => ({
        name: key,
        displayLabel: key,
        displayValue: getDisplayValueForScalar(value),
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(act(edge).attributes).toStrictEqual(attributes);
  });

  it("should format date values in attribute", () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate(),
    };

    const actualAttribute = act(edge, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toStrictEqual(
      formatDate(new Date(edge.attributes.created as any))
    );
  });

  it("should format date values in attribute", () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate(),
    };

    const actualAttribute = act(edge, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toStrictEqual(
      formatDate(new Date(edge.attributes.created as any))
    );
  });

  // Helpers

  function act(edge: Edge, initializeState?: (store: JotaiStore) => void) {
    const { result } = renderHookWithJotai(
      () => useDisplayEdgeFromEdge(edge),
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
