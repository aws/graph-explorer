import { Edge, getRawId } from "@/core";
import {
  createRandomEdge,
  createRandomEdgePreferences,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertex,
  DbState,
  JotaiSnapshot,
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

describe("useDisplayEdgeFromEdge", () => {
  it("should keep the same ID", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    expect(act(edge).id).toEqual(edge.id);
  });

  it("should be an edge", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    expect(act(edge).entityType).toEqual("edge");
  });

  it("should have a display ID equal to the edge ID", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    expect(act(edge).displayId).toEqual(getRawId(edge.id));
  });

  it("should have the display name be the types", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    expect(act(edge).displayName).toEqual(edge.type);
  });

  it("should contain the ID of the source and target vertices", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

    expect(act(edge).source).toEqual(String(edge.source));
    expect(act(edge).target).toEqual(String(edge.target));
  });

  it("should have display name that matches the attribute value", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
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
    ).toEqual(`${attribute.value}`);
  });

  it("should have display name that matches the types when displayNameAttribute is 'type'", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayNameAttribute = "type";
    schema.edges.push(etConfig);

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayName
    ).toEqual(edge.type);
  });

  it("should have the default type config when edge type is not in the schema", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const etConfig = getDefaultEdgeTypeConfig(edge.type);
    const displayConfig = mapToDisplayEdgeTypeConfig(etConfig, t => t);
    expect(act(edge).typeConfig).toEqual(displayConfig);
  });

  it("should use the type config from the merged schema", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
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
    ).toEqual(expectedTypeConfig);
  });

  it("should ignore display label from schema", () => {
    const dbState = new DbState();
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.edges.push(etConfig);

    const { result } = renderHookWithState(
      () => useDisplayEdgeFromEdge(edge),
      dbState
    );

    expect(result.current.displayTypes).toEqual(edge.type);
  });

  it("should use display label from user preferences", () => {
    const dbState = new DbState();
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());

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

    expect(result.current.displayTypes).toEqual(edgePrefs.displayLabel);
  });

  it("should have display types that list all types in gremlin", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      act(edge, withSchemaAndConnection(schema, "gremlin")).displayTypes
    ).toEqual(etConfig.type);
  });

  it("should have display types that list all types in sparql", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
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
    ).toEqual(`example-class:bar`);
  });

  it("should have sorted attributes", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const attributes: DisplayAttribute[] = Object.entries(edge.attributes)
      .map(([key, value]) => ({
        name: key,
        displayLabel: key,
        displayValue: String(value),
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect(act(edge).attributes).toEqual(attributes);
  });

  it("should format date values in attribute when type is Date", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const schema = createRandomSchema();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.attributes.push({
      name: "created",
      dataType: "Date",
    });
    schema.edges.push(etConfig);

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate().toISOString(),
    };

    const actualAttribute = act(edge, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toEqual(
      formatDate(new Date(edge.attributes.created as any))
    );
  });

  it("should format date values in attribute when type is g:Date", () => {
    const edge = createRandomEdge(createRandomVertex(), createRandomVertex());
    const schema = createRandomSchema();
    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.attributes.push({
      name: "created",
      dataType: "g:Date",
    });
    schema.edges.push(etConfig);

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate().toISOString(),
    };

    const actualAttribute = act(edge, withSchema(schema)).attributes.find(
      attr => attr.name === "created"
    );
    expect(actualAttribute?.displayValue).toEqual(
      formatDate(new Date(edge.attributes.created as any))
    );
  });

  // Helpers

  function act(
    edge: Edge,
    initializeState?: (mutableSnapshot: JotaiSnapshot) => void
  ) {
    const { result } = renderHookWithJotai(
      () => useDisplayEdgeFromEdge(edge),
      initializeState
    );
    return result.current;
  }

  function withSchema(schema: Schema) {
    const config = createRandomRawConfiguration();
    return (snapshot: JotaiSnapshot) => {
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(schema: Schema, queryEngine: QueryEngine) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return (snapshot: JotaiSnapshot) => {
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(activeConfigurationAtom, config.id);
    };
  }
});
