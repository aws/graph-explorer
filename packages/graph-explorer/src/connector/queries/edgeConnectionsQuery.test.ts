import { describe, expect, it, vi } from "vitest";

import type {
  EdgeConnectionsRequest,
  ExplorerRequestOptions,
} from "@/connector/useGEFetchTypes";
import type { SchemaStorageModel } from "@/core/StateProvider/schema";

import { createEdgeType, createVertexType, schemaAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { getAppStore } from "@/core/StateProvider/appStore";
import {
  createRandomEdgeConnection,
  createRandomEdgeTypeConfig,
  createTestableEdge,
  createTestableVertex,
  DbState,
  FakeExplorer,
} from "@/utils/testing";

import { edgeConnectionsQuery } from "./edgeConnectionsQuery";

/** Creates a minimal SchemaStorageModel with the given edge types. */
function createSchemaWithEdges(
  ...edgeTypes: ReturnType<typeof createEdgeType>[]
): SchemaStorageModel {
  return {
    vertices: [],
    edges: edgeTypes.map(type => ({ type, attributes: [] })),
  };
}

describe("edgeConnectionsQuery", () => {
  it("should return empty array and persist to store when no edge types provided", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.activeSchema.edgeConnections = undefined;
    state.applyTo(store);

    const fetchEdgeConnectionsSpy = vi.spyOn(explorer, "fetchEdgeConnections");
    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges()),
    );

    expect(result).toStrictEqual([]);
    expect(fetchEdgeConnectionsSpy).not.toHaveBeenCalled();

    const schemaMap = store.get(schemaAtom);
    const activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toStrictEqual([]);
  });

  it("should be disabled when activeSchema is undefined", () => {
    const options = edgeConnectionsQuery(undefined);
    expect(options.enabled).toBe(false);
  });

  it("should return edge connections for requested edge types", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.applyTo(store);

    const fetchEdgeConnectionsSpy = vi.spyOn(explorer, "fetchEdgeConnections");

    const sourceType = createVertexType("Person");
    const targetType = createVertexType("Company");
    const source = createTestableVertex().with({ types: [sourceType] });
    const target = createTestableVertex().with({ types: [targetType] });
    const edge = createTestableEdge().withSource(source).withTarget(target);
    explorer.addTestableEdge(edge);

    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(edge.type)),
    );

    expect(result).toStrictEqual([
      {
        sourceVertexType: sourceType,
        edgeType: edge.type,
        targetVertexType: targetType,
      },
    ]);
    expect(fetchEdgeConnectionsSpy).toBeCalledTimes(1);
  });

  it("should return empty array when edge type not found", async () => {
    const explorer = new FakeExplorer();
    const dbState = new DbState(explorer);
    const store = getAppStore();
    dbState.applyTo(store);

    const edge = createTestableEdge();
    explorer.addTestableEdge(edge);

    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery(
        createSchemaWithEdges(createEdgeType("nonexistent")),
      ),
    );

    expect(result).toStrictEqual([]);
  });

  it("should propagate errors from explorer", async () => {
    const explorer = new FakeExplorer();
    const dbState = new DbState(explorer);
    const store = getAppStore();
    dbState.applyTo(store);

    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(
      new Error("Network error"),
    );

    const queryClient = createQueryClient();

    await expect(
      queryClient.fetchQuery(
        edgeConnectionsQuery(createSchemaWithEdges(createEdgeType("test"))),
      ),
    ).rejects.toThrow("Network error");
  });

  it("should return connections for multiple edge types", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.applyTo(store);

    const source1 = createTestableVertex().with({
      types: [createVertexType("Person")],
    });
    const target1 = createTestableVertex().with({
      types: [createVertexType("Company")],
    });
    const edge1 = createTestableEdge().withSource(source1).withTarget(target1);

    const source2 = createTestableVertex().with({
      types: [createVertexType("Airport")],
    });
    const target2 = createTestableVertex().with({
      types: [createVertexType("City")],
    });
    const edge2 = createTestableEdge().withSource(source2).withTarget(target2);

    explorer.addTestableEdge(edge1);
    explorer.addTestableEdge(edge2);

    const queryClient = createQueryClient();

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(edge1.type, edge2.type)),
    );

    expect(result).toHaveLength(2);
  });

  it("should update the active schema with edge connections", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.applyTo(store);

    const sourceType = createVertexType("Person");
    const targetType = createVertexType("Company");
    const source = createTestableVertex().with({ types: [sourceType] });
    const target = createTestableVertex().with({ types: [targetType] });
    const edge = createTestableEdge().withSource(source).withTarget(target);
    explorer.addTestableEdge(edge);

    const queryClient = createQueryClient();

    await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(edge.type)),
    );

    const schemaMap = store.get(schemaAtom);
    const activeSchema = schemaMap.get(state.activeConfig.id);

    expect(activeSchema?.edgeConnections).toStrictEqual([
      {
        sourceVertexType: sourceType,
        edgeType: edge.type,
        targetVertexType: targetType,
      },
    ]);
  });

  it("should overwrite existing edge connections in the active schema", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.applyTo(store);

    // Set up initial edge connection
    const initialSourceType = createVertexType("Airport");
    const initialTargetType = createVertexType("City");
    const initialSource = createTestableVertex().with({
      types: [initialSourceType],
    });
    const initialTarget = createTestableVertex().with({
      types: [initialTargetType],
    });
    const initialEdge = createTestableEdge()
      .withSource(initialSource)
      .withTarget(initialTarget);
    explorer.addTestableEdge(initialEdge);

    const queryClient = createQueryClient();

    // First query to populate edge connections
    await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(initialEdge.type)),
    );

    // Verify initial state
    let schemaMap = store.get(schemaAtom);
    let activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toStrictEqual([
      {
        sourceVertexType: initialSourceType,
        edgeType: initialEdge.type,
        targetVertexType: initialTargetType,
      },
    ]);

    // Set up new edge connection
    const newSourceType = createVertexType("Person");
    const newTargetType = createVertexType("Company");
    const newSource = createTestableVertex().with({ types: [newSourceType] });
    const newTarget = createTestableVertex().with({ types: [newTargetType] });
    const newEdge = createTestableEdge()
      .withSource(newSource)
      .withTarget(newTarget);
    explorer.addTestableEdge(newEdge);

    // Second query with different edge type should overwrite
    await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(newEdge.type)),
    );

    // Verify edge connections were overwritten, not merged
    schemaMap = store.get(schemaAtom);
    activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toStrictEqual([
      {
        sourceVertexType: newSourceType,
        edgeType: newEdge.type,
        targetVertexType: newTargetType,
      },
    ]);
  });

  it("should update store to empty array when query runs with empty edge types", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.applyTo(store);

    // Set up initial edge connection
    const sourceType = createVertexType("Person");
    const targetType = createVertexType("Company");
    const source = createTestableVertex().with({ types: [sourceType] });
    const target = createTestableVertex().with({ types: [targetType] });
    const edge = createTestableEdge().withSource(source).withTarget(target);
    explorer.addTestableEdge(edge);

    const queryClient = createQueryClient();

    // First query to populate edge connections
    await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(edge.type)),
    );

    // Verify initial state has edge connections
    let schemaMap = store.get(schemaAtom);
    let activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toHaveLength(1);

    // Query with empty edge types persists [] to store
    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges()),
    );

    expect(result).toStrictEqual([]);

    schemaMap = store.get(schemaAtom);
    activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toStrictEqual([]);
  });

  it("should not set lastEdgeConnectionSyncFail when aborted", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();

    const edge = createRandomEdgeTypeConfig();
    state.activeSchema.edges = [edge];
    state.applyTo(store);

    vi.spyOn(explorer, "fetchEdgeConnections").mockImplementation(
      (_req: EdgeConnectionsRequest, options?: ExplorerRequestOptions) => {
        options?.signal?.throwIfAborted();
        throw new Error("should not reach here");
      },
    );

    const abortController = new AbortController();
    abortController.abort();

    const schema = createSchemaWithEdges(edge.type);
    const options = edgeConnectionsQuery(schema);
    await expect(
      options.queryFn!({
        signal: abortController.signal,
        meta: { store, explorer },
      } as any),
    ).rejects.toThrow();

    const schemaMap = store.get(schemaAtom);
    const activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.lastEdgeConnectionSyncFail).not.toBe(true);
  });

  it("should set lastEdgeConnectionSyncFail when query fails", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();

    const edge = createRandomEdgeTypeConfig();
    state.activeSchema.edges = [edge];
    state.activeSchema.edgeConnections = undefined;
    state.applyTo(store);

    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(
      new Error("Connection failed"),
    );

    const queryClient = createQueryClient();

    await expect(
      queryClient.fetchQuery(
        edgeConnectionsQuery(createSchemaWithEdges(edge.type)),
      ),
    ).rejects.toThrow();

    const schemaMap = store.get(schemaAtom);
    const activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.lastEdgeConnectionSyncFail).toBe(true);
    // Edge connections remain undefined since the query failed
    expect(activeSchema?.edgeConnections).toBeUndefined();
  });

  it("should clear lastEdgeConnectionSyncFail on success", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();

    state.activeSchema.lastEdgeConnectionSyncFail = true;
    state.activeSchema.edgeConnections = undefined;
    state.applyTo(store);

    const sourceType = createVertexType("Person");
    const targetType = createVertexType("Company");
    const source = createTestableVertex().with({ types: [sourceType] });
    const target = createTestableVertex().with({ types: [targetType] });
    const edge = createTestableEdge().withSource(source).withTarget(target);
    explorer.addTestableEdge(edge);

    const queryClient = createQueryClient();
    await queryClient.fetchQuery(
      edgeConnectionsQuery(createSchemaWithEdges(edge.type)),
    );

    const schemaMap = store.get(schemaAtom);
    const activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.lastEdgeConnectionSyncFail).toBe(false);
    expect(activeSchema?.edgeConnections).toHaveLength(1);
  });

  it("should preserve existing edgeConnections when query fails", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();

    const existingEdgeConnections = [createRandomEdgeConnection()];
    const edge = createRandomEdgeTypeConfig();
    state.activeSchema.edges = [edge];
    state.activeSchema.edgeConnections = existingEdgeConnections;
    state.applyTo(store);

    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(
      new Error("Network error"),
    );

    const queryClient = createQueryClient();

    await expect(
      queryClient.fetchQuery(
        edgeConnectionsQuery(createSchemaWithEdges(edge.type)),
      ),
    ).rejects.toThrow();

    const schemaMap = store.get(schemaAtom);
    const activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.lastEdgeConnectionSyncFail).toBe(true);
    expect(activeSchema?.edgeConnections).toStrictEqual(
      existingEdgeConnections,
    );
  });
});
