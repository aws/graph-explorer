// @vitest-environment happy-dom
import { createRandomInteger } from "@shared/utils/testing";
import { vi } from "vitest";

import type { RawConfiguration, SchemaStorageModel } from "@/core";

import {
  createRandomEdgeTypeConfig,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexTypeConfig,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import useEntitiesCounts from "./useEntitiesCounts";

async function renderUseEntitiesHook(
  config: RawConfiguration,
  schema: SchemaStorageModel,
) {
  const dbState = new DbState();
  dbState.activeSchema = schema;
  dbState.activeConfig = config;
  return await renderHookWithState(() => useEntitiesCounts(), dbState);
}

describe("useEntitiesCounts", () => {
  let config: RawConfiguration;
  let schema: SchemaStorageModel;

  beforeEach(() => {
    config = createRandomRawConfiguration();
    schema = createRandomSchema();
    vi.resetAllMocks();
  });

  it("should return null when schema has not been synced", async () => {
    schema.lastUpdate = undefined;
    schema.lastSyncFail = false;

    const { result } = await renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBeNull();
    expect(result.current.totalEdges).toBeNull();
  });

  it("should return null when schema has tried to sync", async () => {
    schema.lastUpdate = undefined;
    schema.lastSyncFail = true;

    const { result } = await renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBeNull();
    expect(result.current.totalEdges).toBeNull();
  });

  it("should return total vertices when totalVertices is defined", async () => {
    const preCalculatedTotal = createRandomInteger();
    schema.totalVertices = preCalculatedTotal;
    schema.totalEdges = preCalculatedTotal;

    const { result } = await renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toEqual(preCalculatedTotal);
    expect(result.current.totalEdges).toEqual(preCalculatedTotal);
  });

  it("should return 0 when schema has no entity type configs", async () => {
    schema.totalVertices = 0;
    schema.vertices = [];
    schema.totalEdges = 0;
    schema.edges = [];

    const { result } = await renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBe(0);
    expect(result.current.totalEdges).toBe(0);
  });

  it("should calculate total when all entity type configs have a total", async () => {
    schema.totalVertices = 0;
    schema.vertices = [
      createRandomVertexTypeConfig(),
      createRandomVertexTypeConfig(),
    ].map(vtConfig => ({ ...vtConfig, total: 5 }));
    schema.totalEdges = 0;
    schema.edges = [
      createRandomEdgeTypeConfig(),
      createRandomEdgeTypeConfig(),
    ].map(etConfig => ({ ...etConfig, total: 5 }));

    const { result } = await renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toEqual(10);
    expect(result.current.totalEdges).toEqual(10);
  });

  it("should return null when some entity type configs are missing a total", async () => {
    schema.totalVertices = 0;
    schema.vertices = [
      createRandomVertexTypeConfig(),
      createRandomVertexTypeConfig(),
    ].map(vtConfig => ({ ...vtConfig, total: undefined }));
    schema.vertices[0].total = 10;

    schema.totalEdges = 0;
    schema.edges = [
      createRandomEdgeTypeConfig(),
      createRandomEdgeTypeConfig(),
    ].map(etConfig => ({ ...etConfig, total: undefined }));
    schema.edges[0].total = 10;

    const { result } = await renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBeNull();
    expect(result.current.totalEdges).toBeNull();
  });
});
