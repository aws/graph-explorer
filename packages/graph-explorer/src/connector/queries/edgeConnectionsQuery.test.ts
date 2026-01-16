import { createEdgeType, createVertexType, schemaAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { getAppStore } from "@/core/StateProvider/appStore";
import {
  createTestableEdge,
  createTestableVertex,
  DbState,
  FakeExplorer,
} from "@/utils/testing";

import { edgeConnectionsQuery } from "./edgeConnectionsQuery";

describe("edgeConnectionsQuery", () => {
  it("should return empty array when no edge types provided", async () => {
    const explorer = new FakeExplorer();
    const state = new DbState(explorer);
    const store = getAppStore();
    state.applyTo(store);

    const fetchEdgeConnectionsSpy = vi.spyOn(explorer, "fetchEdgeConnections");
    const queryClient = createQueryClient({ explorer, store });

    const result = await queryClient.fetchQuery(edgeConnectionsQuery([]));

    expect(result.edgeConnections).toStrictEqual([]);
    expect(fetchEdgeConnectionsSpy).toBeCalledTimes(1);
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

    const queryClient = createQueryClient({ explorer, store });

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery([edge.type]),
    );

    expect(result.edgeConnections).toStrictEqual([
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

    const queryClient = createQueryClient({ explorer, store });

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery([createEdgeType("nonexistent")]),
    );

    expect(result.edgeConnections).toStrictEqual([]);
  });

  it("should propagate errors from explorer", async () => {
    const explorer = new FakeExplorer();
    const dbState = new DbState(explorer);
    const store = getAppStore();
    dbState.applyTo(store);

    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(
      new Error("Network error"),
    );

    const queryClient = createQueryClient({ explorer, store });

    await expect(
      queryClient.fetchQuery(edgeConnectionsQuery([createEdgeType("test")])),
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

    const queryClient = createQueryClient({ explorer, store });

    const result = await queryClient.fetchQuery(
      edgeConnectionsQuery([edge1.type, edge2.type]),
    );

    expect(result.edgeConnections).toHaveLength(2);
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

    const queryClient = createQueryClient({ explorer, store });

    await queryClient.fetchQuery(edgeConnectionsQuery([edge.type]));

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

    const queryClient = createQueryClient({ explorer, store });

    // First query to populate edge connections
    await queryClient.fetchQuery(edgeConnectionsQuery([initialEdge.type]));

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
    await queryClient.fetchQuery(edgeConnectionsQuery([newEdge.type]));

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

  it("should clear existing edge connections when query returns empty results", async () => {
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

    const queryClient = createQueryClient({ explorer, store });

    // First query to populate edge connections
    await queryClient.fetchQuery(edgeConnectionsQuery([edge.type]));

    // Verify initial state has edge connections
    let schemaMap = store.get(schemaAtom);
    let activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toHaveLength(1);

    // Query with empty edge types should clear connections
    await queryClient.fetchQuery(edgeConnectionsQuery([]));

    // Verify edge connections were cleared
    schemaMap = store.get(schemaAtom);
    activeSchema = schemaMap.get(state.activeConfig.id);
    expect(activeSchema?.edgeConnections).toStrictEqual([]);
  });
});
