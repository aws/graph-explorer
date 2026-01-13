import { act, waitFor } from "@testing-library/react";

import {
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
} from "@/core";
import {
  createTestableEdge,
  createTestableVertex,
  DbState,
  FakeExplorer,
  renderHookWithJotai,
  renderHookWithState,
} from "@/utils/testing";

import useExpandNode, {
  type ExpandNodesRequest,
  useDefaultNeighborExpansionLimit,
} from "./useExpandNode";

describe("useDefaultNeighborExpansionLimit", () => {
  it("should return the app limit when defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      delete dbState.activeConfig.connection.nodeExpansionLimit;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      store => {
        dbState.applyTo(store);
        store.set(defaultNeighborExpansionLimitAtom, 10);
        store.set(defaultNeighborExpansionLimitEnabledAtom, true);
      },
    );

    expect(result.current).toBe(10);
  });

  it("should return the connection limit when defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      dbState.activeConfig.connection.nodeExpansionLimit = 20;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      store => {
        dbState.applyTo(store);
      },
    );

    expect(result.current).toBe(20);
  });

  it("should return the connection limit when both app and connection limits are defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      dbState.activeConfig.connection.nodeExpansionLimit = 20;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      store => {
        dbState.applyTo(store);
        store.set(defaultNeighborExpansionLimitEnabledAtom, true);
        store.set(defaultNeighborExpansionLimitAtom, 10);
      },
    );

    expect(result.current).toBe(20);
  });

  it("should return null when neither app nor connection limits are defined", () => {
    const dbState = new DbState();
    if (dbState.activeConfig.connection) {
      delete dbState.activeConfig.connection.nodeExpansionLimit;
    }
    const { result } = renderHookWithJotai(
      () => useDefaultNeighborExpansionLimit(),
      store => {
        dbState.applyTo(store);
        store.set(defaultNeighborExpansionLimitEnabledAtom, false);
      },
    );

    expect(result.current).toBeNull();
  });
});

describe("useExpandNode", () => {
  let explorer = new FakeExplorer();
  let dbState = new DbState();

  beforeEach(() => {
    explorer = new FakeExplorer();
    dbState = new DbState(explorer);
  });

  function renderHookExpandNode() {
    return renderHookWithState(() => useExpandNode(), dbState);
  }

  it("should return isPending as false initially", () => {
    const { result } = renderHookExpandNode();

    expect(result.current.isPending).toBe(false);
  });

  it("should not expand when vertex has no unfetched neighbors", () => {
    const vertex = createTestableVertex();
    const neighbor = createTestableVertex();
    const edge = createTestableEdge().withSource(vertex).withTarget(neighbor);

    // Add edge to both graph and explorer (so all neighbors are fetched)
    dbState.addTestableEdgeToGraph(edge);
    explorer.addTestableEdge(edge);

    const { result } = renderHookExpandNode();

    act(() => {
      result.current.expandNode({ vertexId: vertex.id });
    });

    // Should not have added any new vertices since all neighbors are already fetched
    expect(result.current.isPending).toBe(false);
  });

  it("should expand node and add neighbors to graph", async () => {
    const vertex = createTestableVertex();
    const neighbor = createTestableVertex();
    const edge = createTestableEdge().withSource(vertex).withTarget(neighbor);

    // Add only the source vertex to the graph
    dbState.addTestableVertexToGraph(vertex);

    // Add the edge to the explorer (simulating unfetched neighbors)
    explorer.addTestableEdge(edge);

    vi.spyOn(explorer, "fetchNeighbors");

    const { result } = renderHookExpandNode();

    act(() => {
      result.current.expandNode({ vertexId: vertex.id });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(explorer.fetchNeighbors).toHaveBeenCalledWith(
      expect.objectContaining({
        vertexId: vertex.id,
        excludedVertices: new Set(),
      }),
    );
  });

  it("should exclude already fetched neighbors from expansion request", async () => {
    const vertex = createTestableVertex();
    const fetchedNeighbor = createTestableVertex();
    const unfetchedNeighbor = createTestableVertex();
    const fetchedEdge = createTestableEdge()
      .withSource(vertex)
      .withTarget(fetchedNeighbor);
    const unfetchedEdge = createTestableEdge()
      .withSource(vertex)
      .withTarget(unfetchedNeighbor);

    // Add vertex and one neighbor to the graph (fetched)
    dbState.addTestableEdgeToGraph(fetchedEdge);

    // Add both edges to the explorer
    explorer.addTestableEdge(fetchedEdge);
    explorer.addTestableEdge(unfetchedEdge);

    vi.spyOn(explorer, "fetchNeighbors");

    const { result } = renderHookExpandNode();

    act(() => {
      result.current.expandNode({ vertexId: vertex.id });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Should exclude the already fetched neighbor
    expect(explorer.fetchNeighbors).toHaveBeenCalledWith(
      expect.objectContaining({
        vertexId: vertex.id,
        excludedVertices: new Set([fetchedNeighbor.id]),
      }),
    );
  });

  describe("expandNodes (multiple)", () => {
    it("should expand multiple nodes in parallel", async () => {
      const vertex1 = createTestableVertex();
      const vertex2 = createTestableVertex();
      const neighbor1 = createTestableVertex();
      const neighbor2 = createTestableVertex();
      const edge1 = createTestableEdge()
        .withSource(vertex1)
        .withTarget(neighbor1);
      const edge2 = createTestableEdge()
        .withSource(vertex2)
        .withTarget(neighbor2);

      // Add only source vertices to the graph
      dbState.addTestableVertexToGraph(vertex1);
      dbState.addTestableVertexToGraph(vertex2);

      // Add edges to explorer (simulating unfetched neighbors)
      explorer.addTestableEdge(edge1);
      explorer.addTestableEdge(edge2);

      vi.spyOn(explorer, "fetchNeighbors");

      const { result } = renderHookExpandNode();

      act(() => {
        result.current.expandNodes({ vertexIds: [vertex1.id, vertex2.id] });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(explorer.fetchNeighbors).toHaveBeenCalledTimes(2);
      expect(explorer.fetchNeighbors).toHaveBeenCalledWith(
        expect.objectContaining({ vertexId: vertex1.id }),
      );
      expect(explorer.fetchNeighbors).toHaveBeenCalledWith(
        expect.objectContaining({ vertexId: vertex2.id }),
      );
    });

    it("should not expand nodes with no unfetched neighbors", async () => {
      const vertex1 = createTestableVertex();
      const vertex2 = createTestableVertex();
      const neighbor1 = createTestableVertex();
      const edge1 = createTestableEdge()
        .withSource(vertex1)
        .withTarget(neighbor1);

      // vertex1 has all neighbors fetched, vertex2 has none
      dbState.addTestableEdgeToGraph(edge1);
      dbState.addTestableVertexToGraph(vertex2);

      explorer.addTestableEdge(edge1);

      vi.spyOn(explorer, "fetchNeighbors");

      const { result } = renderHookExpandNode();

      act(() => {
        result.current.expandNodes({ vertexIds: [vertex1.id, vertex2.id] });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      // Should not call fetchNeighbors for either vertex
      // vertex1 has no unfetched neighbors, vertex2 has no neighbors at all
      expect(explorer.fetchNeighbors).not.toHaveBeenCalled();
    });

    it("should pass filters to all expansion requests", async () => {
      const vertex1 = createTestableVertex();
      const vertex2 = createTestableVertex();
      const neighbor1 = createTestableVertex().with({ types: ["Person"] });
      const neighbor2 = createTestableVertex().with({ types: ["Person"] });
      const edge1 = createTestableEdge()
        .withSource(vertex1)
        .withTarget(neighbor1);
      const edge2 = createTestableEdge()
        .withSource(vertex2)
        .withTarget(neighbor2);

      dbState.addTestableVertexToGraph(vertex1);
      dbState.addTestableVertexToGraph(vertex2);

      explorer.addTestableEdge(edge1);
      explorer.addTestableEdge(edge2);

      vi.spyOn(explorer, "fetchNeighbors");

      const { result } = renderHookExpandNode();

      const request: ExpandNodesRequest = {
        vertexIds: [vertex1.id, vertex2.id],
        filterByVertexTypes: ["Person"],
        limit: 10,
      };

      act(() => {
        result.current.expandNodes(request);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(explorer.fetchNeighbors).toHaveBeenCalledWith(
        expect.objectContaining({
          vertexId: vertex1.id,
          filterByVertexTypes: ["Person"],
          limit: 10,
        }),
      );
      expect(explorer.fetchNeighbors).toHaveBeenCalledWith(
        expect.objectContaining({
          vertexId: vertex2.id,
          filterByVertexTypes: ["Person"],
          limit: 10,
        }),
      );
    });
  });
});
