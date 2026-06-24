// @vitest-environment happy-dom
import { useQueryClient } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { getAppStore } from "@/core/StateProvider/appStore";
import { selectedTabAtom } from "@/modules/SearchSidebar";
import { queryTextAtom } from "@/modules/SearchSidebar/QuerySearchTabContent";
import {
  partialMatchAtom,
  searchTermAtom,
  selectedAttributeAtom,
  selectedVertexTypeAtom,
} from "@/modules/SearchSidebar/useKeywordSearch";
import {
  createTestableEdge,
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import {
  edgesAtom,
  edgesFilteredIdsAtom,
  edgesOutOfFocusIdsAtom,
  edgesSelectedIdsAtom,
  edgesTableFiltersAtom,
  edgesTableSortsAtom,
  edgesTypesFilteredAtom,
} from "./edges";
import { isRestorePreviousSessionAvailableAtom } from "./graphSession";
import {
  nodesAtom,
  nodesFilteredIdsAtom,
  nodesOutOfFocusIdsAtom,
  nodesSelectedIdsAtom,
  nodesTableFiltersAtom,
  nodesTableSortsAtom,
  nodesTypesFilteredAtom,
} from "./nodes";
import useResetState from "./useResetState";

describe("useResetState", () => {
  test("should reset all node atoms", () => {
    const state = new DbState();
    const vertex = createTestableVertex();
    state.addTestableVertexToGraph(vertex);
    state.filterVertex(vertex.asVertex().id);
    state.filterVertexType(vertex.asVertex().types[0]);

    const { result } = renderHookWithState(() => useResetState(), state);
    const store = getAppStore();

    expect(store.get(nodesAtom).size).toBeGreaterThan(0);

    act(() => result.current());

    expect(store.get(nodesAtom).size).toBe(0);
    expect(store.get(nodesSelectedIdsAtom).size).toBe(0);
    expect(store.get(nodesOutOfFocusIdsAtom).size).toBe(0);
    expect(store.get(nodesFilteredIdsAtom).size).toBe(0);
    expect(store.get(nodesTypesFilteredAtom).size).toBe(0);
    expect(store.get(nodesTableFiltersAtom)).toStrictEqual([]);
    expect(store.get(nodesTableSortsAtom)).toStrictEqual([]);
  });

  test("should reset all edge atoms", () => {
    const state = new DbState();
    const edge = createTestableEdge();
    state.addTestableEdgeToGraph(edge);
    state.filterEdge(edge.asEdge().id);
    state.filterEdgeType(edge.asEdge().type);

    const { result } = renderHookWithState(() => useResetState(), state);
    const store = getAppStore();

    expect(store.get(edgesAtom).size).toBeGreaterThan(0);

    act(() => result.current());

    expect(store.get(edgesAtom).size).toBe(0);
    expect(store.get(edgesSelectedIdsAtom).size).toBe(0);
    expect(store.get(edgesOutOfFocusIdsAtom).size).toBe(0);
    expect(store.get(edgesFilteredIdsAtom).size).toBe(0);
    expect(store.get(edgesTypesFilteredAtom).size).toBe(0);
    expect(store.get(edgesTableFiltersAtom)).toStrictEqual([]);
    expect(store.get(edgesTableSortsAtom)).toStrictEqual([]);
  });

  test("should reset search and query editor atoms", () => {
    const { result } = renderHookWithState(() => useResetState());
    const store = getAppStore();

    store.set(searchTermAtom, "test search");
    store.set(selectedVertexTypeAtom, "Person");
    store.set(selectedAttributeAtom, "name");
    store.set(partialMatchAtom, true);
    store.set(selectedTabAtom, "query");
    store.set(queryTextAtom, "MATCH (n) RETURN n");

    act(() => result.current());

    expect(store.get(searchTermAtom)).toBe("(root)");
    expect(store.get(selectedVertexTypeAtom)).toBe("__all");
    expect(store.get(selectedAttributeAtom)).toBe("caption");
    expect(store.get(partialMatchAtom)).toBe(true);
    expect(store.get(selectedTabAtom)).toBe("filter");
    expect(store.get(queryTextAtom)).toBe("");
  });

  test("should reset previous session availability", () => {
    const { result } = renderHookWithState(() => useResetState());
    const store = getAppStore();

    store.set(isRestorePreviousSessionAvailableAtom, false);

    act(() => result.current());

    expect(store.get(isRestorePreviousSessionAvailableAtom)).toBe(true);
  });

  test("should remove all queries from the query client", () => {
    const { result } = renderHookWithState(() => {
      const queryClient = useQueryClient();
      const resetState = useResetState();
      return { queryClient, resetState };
    });

    // Seed a query so there's something to remove
    result.current.queryClient.setQueryData(["test-query"], "test-data");
    expect(result.current.queryClient.getQueryCache().getAll()).toHaveLength(1);

    act(() => result.current.resetState());

    expect(result.current.queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
