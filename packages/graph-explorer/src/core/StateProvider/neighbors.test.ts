import { createVertexId, createVertexType } from "@/core";
import {
  calculateNeighbors,
  useFetchedNeighborsCallback,
  useNeighbors,
} from "./neighbors";
import {
  createRandomVertex,
  createTestableEdge,
  createTestableVertex,
  DbState,
  FakeExplorer,
  renderHookWithState,
} from "@/utils/testing";
import type { NeighborCount } from "@/connector";
import { waitFor } from "@testing-library/react";

describe("calculateNeighbors", () => {
  it("should calculate neighbors correctly", () => {
    const total = {
      total: 10,
      byType: new Map([
        [createVertexType("type1"), 6],
        [createVertexType("type2"), 4],
      ]),
    };
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      { id: createVertexId("2"), types: [createVertexType("type2")] },
      { id: createVertexId("3"), types: [createVertexType("type1")] },
      { id: createVertexId("4"), types: [createVertexType("type2")] },
    ];

    const result = calculateNeighbors(
      total.total,
      total.byType,
      fetchedNeighbors,
    );

    expect(result.all).toEqual(total.total);
    expect(result.fetched).toEqual(4);
    expect(result.unfetched).toEqual(6);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 6, fetched: 2, unfetched: 4 }],
        [createVertexType("type2"), { all: 4, fetched: 2, unfetched: 2 }],
      ]),
    );
  });

  it("should calculate multi-label neighbors correctly", () => {
    const total = {
      total: 10,
      byType: new Map([
        [createVertexType("type1"), 6],
        [createVertexType("type2"), 4],
        [createVertexType("type3"), 2],
      ]),
    };
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      {
        id: createVertexId("2"),
        types: [createVertexType("type2"), createVertexType("type3")],
      },
      { id: createVertexId("3"), types: [createVertexType("type1")] },
      { id: createVertexId("4"), types: [createVertexType("type2")] },
    ];

    const result = calculateNeighbors(
      total.total,
      total.byType,
      fetchedNeighbors,
    );

    expect(result.all).toEqual(total.total);
    expect(result.fetched).toEqual(4);
    expect(result.unfetched).toEqual(6);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 6, fetched: 2, unfetched: 4 }],
        [createVertexType("type2"), { all: 4, fetched: 2, unfetched: 2 }],
        [createVertexType("type3"), { all: 2, fetched: 1, unfetched: 1 }],
      ]),
    );
  });

  it("should calculate multi-label neighbors correctly when all fetched", () => {
    const total = {
      total: 4,
      byType: new Map([
        [createVertexType("type1"), 2],
        [createVertexType("type2"), 2],
        [createVertexType("type3"), 1],
      ]),
    };
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      {
        id: createVertexId("2"),
        types: [createVertexType("type2"), createVertexType("type3")],
      },
      { id: createVertexId("3"), types: [createVertexType("type1")] },
      { id: createVertexId("4"), types: [createVertexType("type2")] },
    ];

    const result = calculateNeighbors(
      total.total,
      total.byType,
      fetchedNeighbors,
    );

    expect(result.all).toEqual(total.total);
    expect(result.fetched).toEqual(4);
    expect(result.unfetched).toEqual(0);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 2, fetched: 2, unfetched: 0 }],
        [createVertexType("type2"), { all: 2, fetched: 2, unfetched: 0 }],
        [createVertexType("type3"), { all: 1, fetched: 1, unfetched: 0 }],
      ]),
    );
  });

  it("should handle empty inputs", () => {
    const result = calculateNeighbors(0, new Map(), []);

    expect(result.all).toEqual(0);
    expect(result.fetched).toEqual(0);
    expect(result.unfetched).toEqual(0);
    expect(result.byType).toEqual(new Map());
  });

  it("should handle no fetched neighbors", () => {
    const total = 10;
    const byType = new Map([
      [createVertexType("type1"), 6],
      [createVertexType("type2"), 4],
    ]);

    const result = calculateNeighbors(total, byType, []);

    expect(result.all).toEqual(10);
    expect(result.fetched).toEqual(0);
    expect(result.unfetched).toEqual(10);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 6, fetched: 0, unfetched: 6 }],
        [createVertexType("type2"), { all: 4, fetched: 0, unfetched: 4 }],
      ]),
    );
  });

  it("should handle no total by type", () => {
    const total = 5;
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      { id: createVertexId("2"), types: [createVertexType("type2")] },
    ];

    const result = calculateNeighbors(total, new Map(), fetchedNeighbors);

    expect(result.all).toEqual(5);
    expect(result.fetched).toEqual(2);
    expect(result.unfetched).toEqual(3);
    expect(result.byType).toEqual(new Map());
  });

  it("should handle duplicate neighbor IDs", () => {
    const total = 3;
    const byType = new Map([[createVertexType("type1"), 3]]);
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      { id: createVertexId("1"), types: [createVertexType("type1")] }, // Duplicate ID
      { id: createVertexId("2"), types: [createVertexType("type1")] },
    ];

    const result = calculateNeighbors(total, byType, fetchedNeighbors);

    expect(result.all).toEqual(3);
    expect(result.fetched).toEqual(2); // Should deduplicate by ID
    expect(result.unfetched).toEqual(1);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 3, fetched: 2, unfetched: 1 }],
      ]),
    );
  });

  it("should handle neighbors with no types", () => {
    const total = 2;
    const byType = new Map([[createVertexType("type1"), 2]]);
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [] },
      { id: createVertexId("2"), types: [createVertexType("type1")] },
    ];

    const result = calculateNeighbors(total, byType, fetchedNeighbors);

    expect(result.all).toEqual(2);
    expect(result.fetched).toEqual(2);
    expect(result.unfetched).toEqual(0);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 2, fetched: 1, unfetched: 1 }],
      ]),
    );
  });

  it("should handle neighbors with types not in totalByType", () => {
    const total = 3;
    const byType = new Map([[createVertexType("type1"), 2]]);
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      { id: createVertexId("2"), types: [createVertexType("type2")] }, // Type not in byType
      { id: createVertexId("3"), types: [createVertexType("type1")] },
    ];

    const result = calculateNeighbors(total, byType, fetchedNeighbors);

    expect(result.all).toEqual(3);
    expect(result.fetched).toEqual(3);
    expect(result.unfetched).toEqual(0);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 2, fetched: 2, unfetched: 0 }],
      ]),
    );
  });

  it("should handle over-fetched scenario", () => {
    const total = 2;
    const byType = new Map([[createVertexType("type1"), 1]]);
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("type1")] },
      { id: createVertexId("2"), types: [createVertexType("type1")] },
      { id: createVertexId("3"), types: [createVertexType("type1")] },
    ];

    const result = calculateNeighbors(total, byType, fetchedNeighbors);

    expect(result.all).toEqual(2);
    expect(result.fetched).toEqual(3);
    expect(result.unfetched).toEqual(0);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("type1"), { all: 1, fetched: 3, unfetched: 0 }],
      ]),
    );
  });

  it("should handle complex multi-type scenario with overlapping types", () => {
    const total = 6;
    const byType = new Map([
      [createVertexType("Person"), 3],
      [createVertexType("Employee"), 2],
      [createVertexType("Manager"), 1],
    ]);
    const fetchedNeighbors = [
      { id: createVertexId("1"), types: [createVertexType("Person")] },
      {
        id: createVertexId("2"),
        types: [createVertexType("Person"), createVertexType("Employee")],
      },
      {
        id: createVertexId("3"),
        types: [createVertexType("Employee"), createVertexType("Manager")],
      },
      { id: createVertexId("4"), types: [createVertexType("Person")] },
    ];

    const result = calculateNeighbors(total, byType, fetchedNeighbors);

    expect(result.all).toEqual(6);
    expect(result.fetched).toEqual(4);
    expect(result.unfetched).toEqual(2);
    expect(result.byType).toEqual(
      new Map([
        [createVertexType("Person"), { all: 3, fetched: 3, unfetched: 0 }],
        [createVertexType("Employee"), { all: 2, fetched: 2, unfetched: 0 }],
        [createVertexType("Manager"), { all: 1, fetched: 1, unfetched: 0 }],
      ]),
    );
  });
});

describe("useNeighbors", () => {
  it("should return default neighbors if no neighbors are found", () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    const { result } = renderHookWithState(
      () => useNeighbors(vertex.id),
      dbState,
    );

    expect(result.current).toEqual({
      all: 0,
      fetched: 0,
      unfetched: 0,
      byType: new Map(),
    });
  });

  it("should return fetched neighbor counts", async () => {
    const explorer = new FakeExplorer();
    const dbState = new DbState(explorer);
    const vertex = createTestableVertex();

    const edge1 = createTestableEdge().withSource(vertex);
    const edge2 = createTestableEdge().withTarget(vertex);

    dbState.addTestableEdgeToGraph(edge1);
    dbState.addTestableEdgeToGraph(edge2);
    explorer.addTestableEdge(edge1);
    explorer.addTestableEdge(edge2);

    const { result } = renderHookWithState(
      () => useNeighbors(vertex.id),
      dbState,
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        all: 2,
        fetched: 2,
        unfetched: 0,
        byType: new Map([
          [edge1.target.types[0], { all: 1, fetched: 1, unfetched: 0 }],
          [edge2.source.types[0], { all: 1, fetched: 1, unfetched: 0 }],
        ]),
      });
    });
  });

  it("should return fetched neighbor counts and handle duplicates", async () => {
    const explorer = new FakeExplorer();
    const dbState = new DbState(explorer);
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();

    const edge1 = createTestableEdge().withSource(vertex1).withTarget(vertex2);
    const edge2 = createTestableEdge().withSource(vertex2).withTarget(vertex1);

    dbState.addTestableEdgeToGraph(edge1);
    dbState.addTestableEdgeToGraph(edge2);
    explorer.addTestableEdge(edge1);
    explorer.addTestableEdge(edge2);

    const { result } = renderHookWithState(
      () => useNeighbors(vertex1.id),
      dbState,
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        all: 1,
        fetched: 1,
        unfetched: 0,
        byType: new Map([
          [vertex2.types[0], { all: 1, fetched: 1, unfetched: 0 }],
        ]),
      });
    });
  });

  it("should return neighbor counts from query", async () => {
    const dbState = new DbState();
    const vertex = createRandomVertex();

    const response: NeighborCount = {
      vertexId: vertex.id,
      totalCount: 8,
      counts: new Map([
        [createVertexType("nodeType1"), 5],
        [createVertexType("nodeType2"), 3],
      ]),
    };
    vi.mocked(dbState.explorer.neighborCounts).mockResolvedValueOnce({
      counts: [response],
    });

    const { result } = renderHookWithState(
      () => useNeighbors(vertex.id),
      dbState,
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        all: 8,
        fetched: 0,
        unfetched: 8,
        byType: new Map([
          [createVertexType("nodeType1"), { all: 5, fetched: 0, unfetched: 5 }],
          [createVertexType("nodeType2"), { all: 3, fetched: 0, unfetched: 3 }],
        ]),
      });
    });
  });
});

describe("useFetchedNeighborsCallback", () => {
  it("should return empty set when no edges exist", () => {
    const dbState = new DbState();
    const vertex = createTestableVertex();
    dbState.addTestableVertexToGraph(vertex);

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(vertex.id);
    expect(neighbors).toEqual(new Set());
  });

  it("should return neighbor IDs for outgoing edges", () => {
    const dbState = new DbState();
    const source = createTestableVertex();
    const target = createTestableVertex();
    const edge = createTestableEdge().withSource(source).withTarget(target);

    dbState.addTestableEdgeToGraph(edge);

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(source.id);
    expect(neighbors).toEqual(new Set([target.id]));
  });

  it("should return neighbor IDs for incoming edges", () => {
    const dbState = new DbState();
    const source = createTestableVertex();
    const target = createTestableVertex();
    const edge = createTestableEdge().withSource(source).withTarget(target);

    dbState.addTestableEdgeToGraph(edge);

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(target.id);
    expect(neighbors).toEqual(new Set([source.id]));
  });

  it("should return unique neighbor IDs when multiple edges connect same vertices", () => {
    const dbState = new DbState();
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    const edge1 = createTestableEdge().withSource(vertex1).withTarget(vertex2);
    const edge2 = createTestableEdge().withSource(vertex2).withTarget(vertex1);

    dbState.addTestableEdgeToGraph(edge1);
    dbState.addTestableEdgeToGraph(edge2);

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(vertex1.id);
    expect(neighbors).toEqual(new Set([vertex2.id]));
  });

  it("should return multiple neighbor IDs", () => {
    const dbState = new DbState();
    const center = createTestableVertex();
    const neighbor1 = createTestableVertex();
    const neighbor2 = createTestableVertex();
    const neighbor3 = createTestableVertex();

    const edge1 = createTestableEdge().withSource(center).withTarget(neighbor1);
    const edge2 = createTestableEdge().withSource(neighbor2).withTarget(center);
    const edge3 = createTestableEdge().withSource(center).withTarget(neighbor3);

    dbState.addTestableEdgeToGraph(edge1);
    dbState.addTestableEdgeToGraph(edge2);
    dbState.addTestableEdgeToGraph(edge3);

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(center.id);
    expect(neighbors).toEqual(
      new Set([neighbor1.id, neighbor2.id, neighbor3.id]),
    );
  });

  it("should exclude edges where neighbor vertex is not in the graph", () => {
    const dbState = new DbState();
    const source = createTestableVertex();
    const target = createTestableVertex();
    const edge = createTestableEdge().withSource(source).withTarget(target);

    // Only add source vertex, not target
    dbState.addTestableVertexToGraph(source);
    dbState.addEdgeToGraph(edge.asEdge());

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(source.id);
    expect(neighbors).toEqual(new Set());
  });

  it("should exclude edges where source vertex is not in the graph", () => {
    const dbState = new DbState();
    const source = createTestableVertex();
    const target = createTestableVertex();
    const edge = createTestableEdge().withSource(source).withTarget(target);

    // Only add target vertex, not source
    dbState.addTestableVertexToGraph(target);
    dbState.addEdgeToGraph(edge.asEdge());

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(target.id);
    expect(neighbors).toEqual(new Set());
  });

  it("should return empty set for vertex not in graph", () => {
    const dbState = new DbState();
    const vertex1 = createTestableVertex();
    const vertex2 = createTestableVertex();
    const orphan = createTestableVertex();
    const edge = createTestableEdge().withSource(vertex1).withTarget(vertex2);

    dbState.addTestableEdgeToGraph(edge);

    const { result } = renderHookWithState(
      () => useFetchedNeighborsCallback(),
      dbState,
    );

    const neighbors = result.current(orphan.id);
    expect(neighbors).toEqual(new Set());
  });
});
