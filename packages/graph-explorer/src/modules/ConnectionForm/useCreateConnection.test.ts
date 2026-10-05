// @vitest-environment happy-dom
import { createRandomName, createRandomUrlString } from "@shared/utils/testing";
import { useQueryClient } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  activeConfigurationAtom,
  configurationAtom,
  getAppStore,
  nodesAtom,
} from "@/core";
import {
  createTestableVertex,
  DbState,
  renderHookWithState,
} from "@/utils/testing";

import { mapToConnectionForm } from "./connectionFormModel";
import { useCreateConnection } from "./useCreateConnection";

function createForm() {
  return mapToConnectionForm(createRandomName("Connection"), {
    graphDbUrl: createRandomUrlString(),
  });
}

describe("useCreateConnection", () => {
  test("saves the connection under its name and activates it", () => {
    const state = new DbState();
    const values = mapToConnectionForm(createRandomName("Connection"), {
      graphDbUrl: "https://database.example.com:8182",
      queryEngine: "sparql",
    });
    const { result } = renderHookWithState(() => useCreateConnection(), state);

    act(() => result.current(values));

    const store = getAppStore();
    const activeId = store.get(activeConfigurationAtom);
    if (!activeId) {
      throw new Error("Expected the new connection to be active");
    }
    expect(activeId).not.toBe(state.activeConfig.id);
    expect(store.get(configurationAtom).get(activeId)).toStrictEqual({
      id: activeId,
      displayLabel: values.name,
      connection: {
        graphDbUrl: "https://database.example.com:8182",
        queryEngine: "sparql",
        awsAuthEnabled: false,
        serviceType: "neptune-db",
        awsRegion: "",
        fetchTimeoutMs: undefined,
        nodeExpansionLimit: undefined,
      },
    });
    expect(store.get(configurationAtom).get(state.activeConfig.id)).toBe(
      state.activeConfig,
    );
  });

  test("clears the graph of the previous connection", () => {
    const state = new DbState();
    state.addTestableVertexToGraph(createTestableVertex());
    const { result } = renderHookWithState(() => useCreateConnection(), state);

    act(() => result.current(createForm()));

    expect(getAppStore().get(nodesAtom).size).toBe(0);
  });

  test("clears the cached queries of the previous connection", () => {
    const state = new DbState();
    const queryKey = [createRandomName("Query")];
    const { result } = renderHookWithState(
      () => ({
        createConnection: useCreateConnection(),
        queryClient: useQueryClient(),
      }),
      state,
    );
    result.current.queryClient.setQueryData(queryKey, createRandomName("Data"));

    act(() => result.current.createConnection(createForm()));

    expect(result.current.queryClient.getQueryData(queryKey)).toBeUndefined();
  });
});
