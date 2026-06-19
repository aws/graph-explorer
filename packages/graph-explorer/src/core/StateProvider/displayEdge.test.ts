// @vitest-environment happy-dom
import type { QueryEngine } from "@shared/types";

import { createRandomDate, createRandomName } from "@shared/utils/testing";

import type { IriNamespace, RdfPrefix } from "@/utils/rdf";

import { getDisplayValueForScalar } from "@/connector/entities";
import {
  activeConfigurationAtom,
  type AppStore,
  configurationAtom,
  createEdgeType,
  type Edge,
  getRawId,
  schemaAtom,
  type SchemaStorageModel,
} from "@/core";
import { formatDate } from "@/utils";
import {
  createRandomEdge,
  createRandomEdgePreferencesStorageModel,
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  DbState,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import type { DisplayAttribute } from "./displayAttribute";

import { useDisplayEdgeFromEdge } from "./displayEdge";

describe("useDisplayEdgeFromEdge", () => {
  let dbState = new DbState();

  beforeEach(() => {
    dbState = new DbState();
  });

  async function renderHookDisplayEdgeFromEdge(edge: Edge) {
    return await renderHookWithState(
      () => useDisplayEdgeFromEdge(edge),
      dbState,
    );
  }

  it("should keep the same ID", async () => {
    const edge = createRandomEdge();
    expect((await act(edge)).id).toStrictEqual(edge.id);
  });

  it("should be an edge", async () => {
    const edge = createRandomEdge();
    expect((await act(edge)).entityType).toStrictEqual("edge");
  });

  it("should have a display ID equal to the edge ID", async () => {
    const edge = createRandomEdge();
    expect((await act(edge)).displayId).toStrictEqual(getRawId(edge.id));
  });

  it("should have the display name be the types", async () => {
    const edge = createRandomEdge();
    expect((await act(edge)).displayName).toStrictEqual(edge.type);
  });

  it("should contain the ID of the source and target vertices", async () => {
    const edge = createRandomEdge();

    expect((await act(edge)).sourceId).toStrictEqual(String(edge.sourceId));
    expect((await act(edge)).targetId).toStrictEqual(String(edge.targetId));
  });

  it("should have display name that matches the attribute value", async () => {
    const edge = createRandomEdge();
    // Get the first attribute
    const attribute = Object.entries(edge.attributes).map(([name, value]) => ({
      name,
      value,
    }))[0];

    dbState.addEdgeStyle(edge.type, {
      displayNameAttribute: attribute.name,
    });

    const { result } = await renderHookDisplayEdgeFromEdge(edge);

    expect(result.current.displayName).toStrictEqual(
      getDisplayValueForScalar(attribute.value),
    );
  });

  it("should have display name that matches the types when displayNameAttribute is 'type'", async () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayNameAttribute = "type";
    schema.edges.push(etConfig);

    expect(
      (await act(edge, withSchemaAndConnection(schema, "gremlin"))).displayName,
    ).toStrictEqual(edge.type);
  });

  it("should ignore display label from schema", async () => {
    const dbState = new DbState();
    const edge = createRandomEdge();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.edges.push(etConfig);

    const { result } = await renderHookWithState(
      () => useDisplayEdgeFromEdge(edge),
      dbState,
    );

    expect(result.current.displayTypes).toStrictEqual(edge.type);
  });

  it("should use display label from user preferences", async () => {
    const dbState = new DbState();
    const edge = createRandomEdge();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    etConfig.displayLabel = createRandomName("schema");
    dbState.activeSchema.edges.push(etConfig);

    const edgePrefs = createRandomEdgePreferencesStorageModel();
    edgePrefs.type = edge.type;
    edgePrefs.displayLabel = createRandomName("prefs");
    dbState.activeStyling.edges?.push(edgePrefs);

    const { result } = await renderHookWithState(
      () => useDisplayEdgeFromEdge(edge),
      dbState,
    );

    expect(result.current.displayTypes).toStrictEqual(edgePrefs.displayLabel);
  });

  it("should have display types that list all types in gremlin", async () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      (await act(edge, withSchemaAndConnection(schema, "gremlin")))
        .displayTypes,
    ).toStrictEqual(etConfig.type);
  });

  it("should have display types that list all types in sparql", async () => {
    const edge = createRandomEdge();
    edge.type = createEdgeType("http://www.example.com/class#bar");
    const schema = createRandomSchema();
    schema.prefixes = [
      {
        prefix: "example-class" as RdfPrefix,
        uri: "http://www.example.com/class#" as IriNamespace,
      },
    ];

    const etConfig = createRandomEdgeTypeConfig();
    etConfig.type = edge.type;
    schema.edges.push(etConfig);

    edge.type = etConfig.type;

    expect(
      (await act(edge, withSchemaAndConnection(schema, "sparql"))).displayTypes,
    ).toStrictEqual(`example-class:bar`);
  });

  it("should have sorted attributes", async () => {
    const edge = createRandomEdge();
    const attributes: DisplayAttribute[] = Object.entries(edge.attributes)
      .map(([key, value]) => ({
        name: key,
        displayLabel: key,
        displayValue: getDisplayValueForScalar(value),
      }))
      .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

    expect((await act(edge)).attributes).toStrictEqual(attributes);
  });

  it("should format date values in attribute", async () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate(),
    };

    const actualAttribute = (
      await act(edge, withSchema(schema))
    ).attributes.find(attr => attr.name === "created");
    expect(actualAttribute?.displayValue).toStrictEqual(
      formatDate(new Date(edge.attributes.created as any)),
    );
  });

  it("should format date values in attribute", async () => {
    const edge = createRandomEdge();
    const schema = createRandomSchema();

    edge.attributes = {
      ...edge.attributes,
      created: createRandomDate(),
    };

    const actualAttribute = (
      await act(edge, withSchema(schema))
    ).attributes.find(attr => attr.name === "created");
    expect(actualAttribute?.displayValue).toStrictEqual(
      formatDate(new Date(edge.attributes.created as any)),
    );
  });

  // Helpers

  async function act(
    edge: Edge,
    initializeState?: (store: AppStore) => void | Promise<void>,
  ) {
    const { result } = await renderHookWithJotai(
      () => useDisplayEdgeFromEdge(edge),
      initializeState,
    );
    return result.current;
  }

  function withSchema(schema: SchemaStorageModel) {
    const config = createRandomRawConfiguration();
    return async (store: AppStore) => {
      await store.set(configurationAtom, new Map([[config.id, config]]));
      await store.set(schemaAtom, new Map([[config.id, schema]]));
      await store.set(activeConfigurationAtom, config.id);
    };
  }

  function withSchemaAndConnection(
    schema: SchemaStorageModel,
    queryEngine: QueryEngine,
  ) {
    const config = createRandomRawConfiguration();
    config.connection!.queryEngine = queryEngine;
    return async (store: AppStore) => {
      await store.set(configurationAtom, new Map([[config.id, config]]));
      await store.set(schemaAtom, new Map([[config.id, schema]]));
      await store.set(activeConfigurationAtom, config.id);
    };
  }
});
