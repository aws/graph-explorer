// @vitest-environment happy-dom

import { act } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { getAppStore } from "@/core/StateProvider/appStore";
import { nodesAtom } from "@/core/StateProvider/nodes";
import {
  activeConnectionIdAtom,
  savedConnectionsAtom,
} from "@/core/StateProvider/storageAtoms";
import {
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import { createRandomSavedConnection } from "@/utils/testing/randomData";

import useActivateConnection from "./useActivateConnection";

describe("useActivateConnection", () => {
  test("sets the active connection and resets the graph session", () => {
    const state = new DbState();
    const vertex = createTestableVertex();
    state.addTestableVertexToGraph(vertex);

    const other = createRandomSavedConnection();

    const { result } = renderHookWithState(
      () => useActivateConnection(),
      state,
    );
    const store = getAppStore();
    store.set(savedConnectionsAtom, prev => {
      const updated = new Map(prev);
      updated.set(other.id, other);
      return updated;
    });

    expect(store.get(nodesAtom).size).toBeGreaterThan(0);

    act(() => result.current(other.id));

    expect(store.get(activeConnectionIdAtom)).toBe(other.id);
    expect(store.get(nodesAtom).size).toBe(0);
  });

  test("activating the already active connection keeps the graph session", () => {
    const state = new DbState();
    const vertex = createTestableVertex();
    state.addTestableVertexToGraph(vertex);

    const { result } = renderHookWithState(
      () => useActivateConnection(),
      state,
    );
    const store = getAppStore();
    const activeId = store.get(activeConnectionIdAtom);
    expect(activeId).toBeDefined();

    const nodeCountBefore = store.get(nodesAtom).size;
    expect(nodeCountBefore).toBeGreaterThan(0);

    act(() => result.current(activeId!));

    expect(store.get(activeConnectionIdAtom)).toBe(activeId);
    expect(store.get(nodesAtom).size).toBe(nodeCountBefore);
  });
});
