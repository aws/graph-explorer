// @vitest-environment happy-dom
import { act } from "@testing-library/react";

import { configurationAtom } from "@/core";
import { getAppStore } from "@/core/StateProvider/appStore";
import {
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";
import { createRandomRawConfiguration } from "@/utils/testing/randomData";

import { nodesAtom } from "./nodes";
import { activeConfigurationAtom } from "./storageAtoms";
import useActivateConnection from "./useActivateConnection";

describe("useActivateConnection", () => {
  test("sets the active connection and resets the graph session", () => {
    const state = new DbState();
    const vertex = createTestableVertex();
    state.addTestableVertexToGraph(vertex);

    const other = createRandomRawConfiguration();

    const { result } = renderHookWithState(
      () => useActivateConnection(),
      state,
    );
    const store = getAppStore();
    store.set(configurationAtom, prev => {
      const updated = new Map(prev);
      updated.set(other.id, other);
      return updated;
    });

    expect(store.get(nodesAtom).size).toBeGreaterThan(0);

    act(() => result.current(other.id));

    expect(store.get(activeConfigurationAtom)).toBe(other.id);
    expect(store.get(nodesAtom).size).toBe(0);
  });
});
