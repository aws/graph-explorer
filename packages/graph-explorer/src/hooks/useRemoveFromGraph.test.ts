import {
  createRandomEdge,
  createRandomVertex,
  DbState,
  renderHookWithRecoilRoot,
} from "@/utils/testing";
import { act } from "react";
import {
  useClearGraph,
  useRemoveEdgeFromGraph,
  useRemoveFromGraph,
  useRemoveNodeFromGraph,
} from "./useRemoveFromGraph";
import { createArray } from "@shared/utils/testing";
import { waitFor } from "@testing-library/react";
import {
  activeGraphSessionAtom,
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  GraphSessionStorageModel,
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  toEdgeMap,
  toNodeMap,
} from "@/core";
import { useAtomValue } from "jotai";

test("should remove one node", async () => {
  const vertex = createRandomVertex();
  const noise = createArray(10, createRandomVertex);
  const idsOfNoise = noise.map(n => n.id);
  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveNodeFromGraph(vertex.id);
      const nodes = useAtomValue(nodesAtom);
      const selected = useAtomValue(nodesSelectedIdsAtom);
      const outOfFocus = useAtomValue(nodesOutOfFocusIdsAtom);
      const filtered = useAtomValue(nodesFilteredIdsAtom);

      return { callback, nodes, selected, outOfFocus, filtered };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([vertex, ...noise]));
      snapshot.set(nodesSelectedIdsAtom, new Set([vertex.id, ...idsOfNoise]));
      snapshot.set(nodesOutOfFocusIdsAtom, new Set([vertex.id, ...idsOfNoise]));
      snapshot.set(nodesFilteredIdsAtom, new Set([vertex.id, ...idsOfNoise]));
    }
  );

  await act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.nodes.has(vertex.id)).toBeFalsy();
    expect(result.current.selected.has(vertex.id)).toBeFalsy();
    expect(result.current.outOfFocus.has(vertex.id)).toBeFalsy();
    expect(result.current.filtered.has(vertex.id)).toBeFalsy();

    expect(result.current.nodes.size).toBe(noise.length);
    expect(result.current.selected.size).toBe(noise.length);
    expect(result.current.outOfFocus.size).toBe(noise.length);
    expect(result.current.filtered.size).toBe(noise.length);
  });
});

test("should remove one edge", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge1 = createRandomEdge(node1, node2);
  const edge2 = createRandomEdge(node2, node1);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveEdgeFromGraph(edge1.id);
      const edges = useAtomValue(edgesAtom);
      const selected = useAtomValue(edgesSelectedIdsAtom);
      const outOfFocus = useAtomValue(edgesOutOfFocusIdsAtom);
      const filtered = useAtomValue(edgesFilteredIdsAtom);

      return { callback, edges, selected, outOfFocus, filtered };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));
      snapshot.set(edgesAtom, toEdgeMap([edge1, edge2]));
      snapshot.set(edgesSelectedIdsAtom, new Set([edge1.id, edge2.id]));
      snapshot.set(edgesOutOfFocusIdsAtom, new Set([edge1.id, edge2.id]));
      snapshot.set(edgesFilteredIdsAtom, new Set([edge1.id, edge2.id]));
    }
  );

  await act(() => result.current.callback());

  await waitFor(() => {
    // Ensure that the edge1 is removed from all graph state
    expect(result.current.edges.has(edge1.id)).toBeFalsy();
    expect(result.current.selected.has(edge1.id)).toBeFalsy();
    expect(result.current.outOfFocus.has(edge1.id)).toBeFalsy();
    expect(result.current.filtered.has(edge1.id)).toBeFalsy();

    // Ensure the other edge was untouched
    expect(result.current.edges.has(edge2.id)).toBeTruthy();
    expect(result.current.selected.has(edge2.id)).toBeTruthy();
    expect(result.current.outOfFocus.has(edge2.id)).toBeTruthy();
    expect(result.current.filtered.has(edge2.id)).toBeTruthy();
  });
});

test("should remove associated edges when a node is removed", async () => {
  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge1 = createRandomEdge(node1, node2);
  const edge2 = createRandomEdge(node2, node1);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveNodeFromGraph(node2.id);

      const edges = useAtomValue(edgesAtom);
      const edgesSelected = useAtomValue(edgesSelectedIdsAtom);
      const edgesOutOfFocus = useAtomValue(edgesOutOfFocusIdsAtom);
      const edgesFiltered = useAtomValue(edgesFilteredIdsAtom);

      return {
        callback,
        edges,
        edgesSelected,
        edgesOutOfFocus,
        edgesFiltered,
      };
    },
    snapshot => {
      snapshot.set(nodesAtom, toNodeMap([node1, node2]));

      snapshot.set(edgesAtom, toEdgeMap([edge1, edge2]));
      snapshot.set(edgesSelectedIdsAtom, new Set([edge1.id, edge2.id]));
      snapshot.set(edgesOutOfFocusIdsAtom, new Set([edge1.id, edge2.id]));
      snapshot.set(edgesFilteredIdsAtom, new Set([edge1.id, edge2.id]));
    }
  );

  await act(() => result.current.callback());

  await waitFor(() => {
    // Should remove all edges since they were associated with the removed node
    expect(result.current.edges.size).toBe(0);
    expect(result.current.edgesSelected.size).toBe(0);
    expect(result.current.edgesOutOfFocus.size).toBe(0);
    expect(result.current.edgesFiltered.size).toBe(0);
  });
});

test("should remove all nodes and edges", async () => {
  const dbState = new DbState();
  dbState.createVertexInGraph();
  dbState.createVertexInGraph();
  dbState.createEdgeInGraph(dbState.vertices[0], dbState.vertices[1]);
  dbState.createEdgeInGraph(dbState.vertices[1], dbState.vertices[0]);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useClearGraph();

      // Nodes
      const nodes = useAtomValue(nodesAtom);
      const nodesSelected = useAtomValue(nodesSelectedIdsAtom);
      const nodesOutOfFocus = useAtomValue(nodesOutOfFocusIdsAtom);
      const nodesFiltered = useAtomValue(nodesFilteredIdsAtom);

      // Edges
      const edges = useAtomValue(edgesAtom);
      const edgesSelected = useAtomValue(edgesSelectedIdsAtom);
      const edgesOutOfFocus = useAtomValue(edgesOutOfFocusIdsAtom);
      const edgesFiltered = useAtomValue(edgesFilteredIdsAtom);

      const graph = useAtomValue(activeGraphSessionAtom);

      return {
        callback,
        nodes,
        nodesSelected,
        nodesOutOfFocus,
        nodesFiltered,
        edges,
        edgesSelected,
        edgesOutOfFocus,
        edgesFiltered,
        graph,
      };
    },
    snapshot => {
      dbState.applyTo(snapshot);
    }
  );

  await act(() => result.current.callback());

  await waitFor(() => {
    expect(result.current.nodes.size).toBe(0);
    expect(result.current.nodesSelected.size).toBe(0);
    expect(result.current.nodesOutOfFocus.size).toBe(0);
    expect(result.current.nodesFiltered.size).toBe(0);

    expect(result.current.edges.size).toBe(0);
    expect(result.current.edgesSelected.size).toBe(0);
    expect(result.current.edgesOutOfFocus.size).toBe(0);
    expect(result.current.edgesFiltered.size).toBe(0);

    expect(result.current.graph).toBe(null);
  });
});

test("should update graph session", async () => {
  const dbState = new DbState();

  const node1 = createRandomVertex();
  const node2 = createRandomVertex();
  const edge1 = createRandomEdge(node1, node2);
  const edge2 = createRandomEdge(node2, node1);

  dbState.addVertexToGraph(node1);
  dbState.addVertexToGraph(node2);
  dbState.addEdgeToGraph(edge1);
  dbState.addEdgeToGraph(edge2);

  const { result } = renderHookWithRecoilRoot(
    () => {
      const callback = useRemoveFromGraph();
      const graph = useAtomValue(activeGraphSessionAtom);

      return {
        callback,
        graph,
      };
    },
    snapshot => {
      dbState.applyTo(snapshot);
    }
  );

  await act(() => result.current.callback({ vertices: [node1.id] }));

  const expected: GraphSessionStorageModel = {
    vertices: new Set([node2.id]),
    edges: new Set(),
  };

  await waitFor(() => {
    expect(result.current.graph).toEqual(expected);
  });
});
