import { createRandomName } from "@shared/utils/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  activeConfigurationAtom,
  type AppStore,
  configurationAtom,
  createVertexType,
  explorerForTestingAtom,
  getAppStore,
  schemaAtom,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  createRandomEdgeConnection,
  createRandomRawConfiguration,
  createTestableVertex,
  FakeExplorer,
} from "@/utils/testing";

import type {
  ExplorerRequestOptions,
  SchemaResponse,
} from "../useGEFetchTypes";

import { schemaSyncQuery } from "./schemaSyncQuery";

describe("schemaSyncQuery", () => {
  let explorer: FakeExplorer;
  let store: AppStore;

  beforeEach(() => {
    vi.restoreAllMocks();
    explorer = new FakeExplorer();
    store = getAppStore();

    // Set up a configuration so the schema can be stored
    const config = createRandomRawConfiguration();
    store.set(configurationAtom, new Map([[config.id, config]]));
    store.set(activeConfigurationAtom, config.id);
    store.set(schemaAtom, new Map());
    store.set(explorerForTestingAtom, explorer);
  });

  it("should fetch schema and update the store", async () => {
    const vertex = createTestableVertex().with({
      types: [createVertexType("Person")],
    });
    explorer.addTestableVertex(vertex);

    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(schemaSyncQuery());

    expect(result.vertices).toHaveLength(1);
    expect(result.vertices[0].type).toBe("Person");

    // Verify schema was stored
    const activeConfigId = store.get(activeConfigurationAtom);
    const storedSchema = store.get(schemaAtom).get(activeConfigId!);
    expect(storedSchema?.lastSyncFail).toBe(false);
    expect(storedSchema?.vertices).toHaveLength(1);
  });

  it("should set lastUpdate to current time", async () => {
    vi.useFakeTimers();
    const fakeNow = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(fakeNow);

    const queryClient = createQueryClient();

    await queryClient.fetchQuery(schemaSyncQuery());

    const activeConfigId = store.get(activeConfigurationAtom);
    const storedSchema = store.get(schemaAtom).get(activeConfigId!);
    expect(storedSchema?.lastUpdate).toStrictEqual(fakeNow);

    vi.useRealTimers();
  });

  it("should replace existing schema for active config", async () => {
    // Set up initial schema with different data
    const activeConfigId = store.get(activeConfigurationAtom)!;
    const oldVertexType = createVertexType("OldType");
    store.set(schemaAtom, prev => {
      const updated = new Map(prev);
      updated.set(activeConfigId, {
        vertices: [{ type: oldVertexType, attributes: [] }],
        edges: [],
      });
      return updated;
    });

    // Mock new schema from explorer
    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");
    const newVertexType = createVertexType("NewType");
    fetchSchemaSpy.mockResolvedValue({
      vertices: [{ type: newVertexType, attributes: [] }],
      edges: [],
    });

    const queryClient = createQueryClient();

    await queryClient.fetchQuery(schemaSyncQuery());

    // Verify old schema was replaced
    const storedSchema = store.get(schemaAtom).get(activeConfigId);
    expect(storedSchema?.vertices).toHaveLength(1);
    expect(storedSchema?.vertices[0].type).toBe(newVertexType);
  });

  it("should return empty schema when no data exists", async () => {
    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(schemaSyncQuery());

    expect(result.vertices).toStrictEqual([]);
    expect(result.edges).toStrictEqual([]);
  });

  it("should set lastSyncFail when fetch fails", async () => {
    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");
    fetchSchemaSpy.mockRejectedValue(new Error("Network error"));

    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({
      ...queryClient.getDefaultOptions(),
      queries: { ...queryClient.getDefaultOptions().queries, retry: false },
    });

    await expect(queryClient.fetchQuery(schemaSyncQuery())).rejects.toThrow(
      "Network error",
    );

    const activeConfigId = store.get(activeConfigurationAtom);
    const storedSchema = store.get(schemaAtom).get(activeConfigId!);
    expect(storedSchema?.lastSyncFail).toBe(true);
  });

  it("should preserve existing edgeConnections on success", async () => {
    const activeConfigId = store.get(activeConfigurationAtom)!;
    const existingEdgeConnections = [createRandomEdgeConnection()];
    store.set(schemaAtom, prev => {
      const updated = new Map(prev);
      updated.set(activeConfigId, {
        vertices: [],
        edges: [],
        edgeConnections: existingEdgeConnections,
      });
      return updated;
    });

    const queryClient = createQueryClient();
    await queryClient.fetchQuery(schemaSyncQuery());

    const storedSchema = store.get(schemaAtom).get(activeConfigId);
    expect(storedSchema?.edgeConnections).toStrictEqual(
      existingEdgeConnections,
    );
  });

  it("should clear lastSyncFail on success", async () => {
    // Set up a schema with lastSyncFail
    const activeConfigId = store.get(activeConfigurationAtom)!;
    store.set(schemaAtom, prev => {
      const updated = new Map(prev);
      updated.set(activeConfigId, {
        vertices: [],
        edges: [],
        lastSyncFail: true,
      });
      return updated;
    });

    const queryClient = createQueryClient();
    await queryClient.fetchQuery(schemaSyncQuery());

    const storedSchema = store.get(schemaAtom).get(activeConfigId);
    expect(storedSchema?.lastSyncFail).toBe(false);
  });

  it("should preserve existing schema in store on failure", async () => {
    // Set up initial schema
    const activeConfigId = store.get(activeConfigurationAtom)!;
    const initialVertexType = createVertexType(createRandomName("VertexType"));
    store.set(schemaAtom, prev => {
      const updated = new Map(prev);
      updated.set(activeConfigId, {
        vertices: [{ type: initialVertexType, attributes: [] }],
        edges: [],
      });
      return updated;
    });

    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");
    fetchSchemaSpy.mockRejectedValue(new Error("Network error"));

    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({
      ...queryClient.getDefaultOptions(),
      queries: { ...queryClient.getDefaultOptions().queries, retry: false },
    });

    await expect(queryClient.fetchQuery(schemaSyncQuery())).rejects.toThrow(
      "Network error",
    );

    // Verify existing data was preserved
    const storedSchema = store.get(schemaAtom).get(activeConfigId);
    expect(storedSchema?.vertices).toHaveLength(1);
    expect(storedSchema?.vertices[0].type).toBe(initialVertexType);
  });

  it("should generate prefixes for URI-like vertex types", async () => {
    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");
    const mockSchema: SchemaResponse = {
      vertices: [
        {
          type: createVertexType("http://example.org/ontology/Person"),
          attributes: [
            { name: "http://example.org/ontology/name", dataType: "String" },
          ],
        },
      ],
      edges: [],
    };
    fetchSchemaSpy.mockResolvedValue(mockSchema);

    const queryClient = createQueryClient();

    await queryClient.fetchQuery(schemaSyncQuery());

    const activeConfigId = store.get(activeConfigurationAtom);
    const storedSchema = store.get(schemaAtom).get(activeConfigId!);

    // Verify prefixes were generated for the URI
    expect(storedSchema?.prefixes).toBeDefined();
    expect(storedSchema?.prefixes?.length).toBeGreaterThan(0);
  });

  it("should pass signal to explorer fetchSchema", async () => {
    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");

    const queryClient = createQueryClient();

    await queryClient.fetchQuery(schemaSyncQuery());

    expect(fetchSchemaSpy).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("should abort when signal is aborted", async () => {
    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");
    fetchSchemaSpy.mockImplementation(
      (options?: ExplorerRequestOptions): Promise<SchemaResponse> => {
        return new Promise((_resolve, reject) => {
          if (options?.signal?.aborted) {
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          options?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
          // Never resolve to simulate a long-running request
        });
      },
    );

    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({
      ...queryClient.getDefaultOptions(),
      queries: { ...queryClient.getDefaultOptions().queries, retry: false },
    });

    const queryPromise = queryClient.fetchQuery(schemaSyncQuery());

    // Cancel the query
    await queryClient.cancelQueries({ queryKey: ["schema"] });

    await expect(queryPromise).rejects.toThrow();
  });

  it("should handle schema with multiple vertex and edge types", async () => {
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    explorer.addTestableVertex(vertex1);
    explorer.addTestableVertex(vertex2);

    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(schemaSyncQuery());

    expect(result.vertices.length).toBeGreaterThanOrEqual(2);
    expect(result.totalVertices).toBe(2);
  });

  it("should update schema with totals from response", async () => {
    const fetchSchemaSpy = vi.spyOn(explorer, "fetchSchema");
    const mockSchema: SchemaResponse = {
      vertices: [
        { type: createVertexType(createRandomName("Type")), attributes: [] },
      ],
      edges: [],
      totalVertices: 100,
      totalEdges: 50,
    };
    fetchSchemaSpy.mockResolvedValue(mockSchema);

    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(schemaSyncQuery());

    expect(result.totalVertices).toBe(100);
    expect(result.totalEdges).toBe(50);
  });
});
