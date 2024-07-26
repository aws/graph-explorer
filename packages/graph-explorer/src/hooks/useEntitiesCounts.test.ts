import useEntitiesCounts from "./useEntitiesCounts";
import { RawConfiguration, Schema } from "../core";
import { vi } from "vitest";
import {
  createRandomEdgeTypeConfig,
  createRandomInteger,
  createRandomRawConfiguration,
  createRandomSchema,
  createRandomVertexTypeConfig,
  renderHookWithRecoilRoot,
} from "../utils/testing";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../core/StateProvider/configuration";
import { schemaAtom } from "../core/StateProvider/schema";

function renderUseEntitiesHook(config: RawConfiguration, schema: Schema) {
  return renderHookWithRecoilRoot(
    () => useEntitiesCounts(),
    snapshot => {
      snapshot.set(schemaAtom, new Map([[config.id, schema]]));
      snapshot.set(configurationAtom, new Map([[config.id, config]]));
      snapshot.set(activeConfigurationAtom, config.id);
    }
  );
}

describe("useEntitiesCounts", () => {
  let config: RawConfiguration;
  let schema: Schema;

  beforeEach(() => {
    config = createRandomRawConfiguration();
    schema = createRandomSchema();
    vi.resetAllMocks();
  });

  it("should return null when schema has not been synced", () => {
    schema.lastUpdate = undefined;
    schema.triedToSync = false;
    schema.lastSyncFail = false;

    const { result } = renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBeNull();
    expect(result.current.totalEdges).toBeNull();
  });

  it("should return null when schema has tried to sync", () => {
    schema.lastUpdate = undefined;
    schema.triedToSync = true;
    schema.lastSyncFail = true;

    const { result } = renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBeNull();
    expect(result.current.totalEdges).toBeNull();
  });

  it("should return total vertices when totalVertices is defined", () => {
    const preCalculatedTotal = createRandomInteger();
    schema.totalVertices = preCalculatedTotal;
    schema.totalEdges = preCalculatedTotal;

    const { result } = renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toEqual(preCalculatedTotal);
    expect(result.current.totalEdges).toEqual(preCalculatedTotal);
  });

  it("should return 0 when schema has no entity type configs", () => {
    schema.totalVertices = 0;
    schema.vertices = [];
    schema.totalEdges = 0;
    schema.edges = [];

    const { result } = renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBe(0);
    expect(result.current.totalEdges).toBe(0);
  });

  it("should calculate total when when all entity type configs have a total", () => {
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

    const { result } = renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toEqual(10);
    expect(result.current.totalEdges).toEqual(10);
  });

  it("should return null when some entity type configs are missing a total", () => {
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

    const { result } = renderUseEntitiesHook(config, schema);

    expect(result.current.totalNodes).toBeNull();
    expect(result.current.totalEdges).toBeNull();
  });
});
