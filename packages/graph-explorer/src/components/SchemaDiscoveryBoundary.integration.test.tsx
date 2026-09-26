// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createEdgeType, getAppStore, schemaAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import {
  createTestableEdge,
  DbState,
  FakeExplorer,
  flushPendingAtomUpdates,
  TestProvider,
} from "@/utils/testing";

import { SchemaDiscoveryBoundary } from "./SchemaDiscoveryBoundary";

/**
 * These tests render against the real Jotai store and query client rather than
 * mocking the schema hooks, so they observe how the boundary reacts to the
 * store write that edge connection discovery performs.
 */
describe("SchemaDiscoveryBoundary against the real store", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  function renderBoundary(state: DbState) {
    const store = getAppStore();
    state.applyTo(store);

    return render(
      <TestProvider client={createQueryClient()} store={store}>
        <SchemaDiscoveryBoundary>
          <div>Children</div>
        </SchemaDiscoveryBoundary>
      </TestProvider>,
    );
  }

  test("renders children once discovery resolves zero edge types to an empty edge connection list", async () => {
    const state = new DbState(explorer);
    state.activeSchema.edges = [];
    state.activeSchema.edgeConnections = undefined;

    renderBoundary(state);

    const store = getAppStore();
    await waitFor(() => {
      expect(
        store.get(schemaAtom).get(state.activeConfig.id)?.edgeConnections,
      ).toStrictEqual([]);
    });
    await waitFor(() => {
      expect(screen.queryByText("Synchronizing...")).not.toBeInTheDocument();
    });
    await flushPendingAtomUpdates();

    expect(screen.getByText("Children")).toBeInTheDocument();
    expect(screen.queryByText(/Available$/)).not.toBeInTheDocument();
  });

  test("renders children when edge connection discovery rejects", async () => {
    const fetchEdgeConnections = vi
      .spyOn(explorer, "fetchEdgeConnections")
      .mockRejectedValue(new Error("Edge connection discovery failed"));

    const state = new DbState(explorer);
    state.activeSchema.edges = [
      { type: createEdgeType("knows"), attributes: [] },
    ];
    state.activeSchema.edgeConnections = undefined;

    renderBoundary(state);

    await waitFor(() => {
      expect(screen.queryByText("Synchronizing...")).not.toBeInTheDocument();
    });
    await flushPendingAtomUpdates();

    expect(fetchEdgeConnections).toHaveBeenCalled();
    const store = getAppStore();
    expect(
      store.get(schemaAtom).get(state.activeConfig.id)
        ?.lastEdgeConnectionSyncFail,
    ).toBe(true);
    expect(screen.getByText("Children")).toBeInTheDocument();
  });

  test("fetches edge connections once when a refresh fails edge discovery for a schema that had them", async () => {
    // Slow enough that the boundary renders "Synchronizing..." and unmounts
    // its children, so they remount once discovery fails.
    const fetchEdgeConnections = vi
      .spyOn(explorer, "fetchEdgeConnections")
      .mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        throw new Error("Edge connection discovery failed");
      });

    const edge = createTestableEdge();
    explorer.addTestableEdge(edge);
    const state = new DbState(explorer);
    state.activeSchema.edges = [];
    state.addTestableEdgeToGraph(edge);
    state.activeSchema.edgeConnections = [];

    const store = getAppStore();
    state.applyTo(store);
    const client = createQueryClient();
    client.setDefaultOptions({
      queries: { ...client.getDefaultOptions().queries, retry: false },
    });

    render(
      <TestProvider client={client} store={store}>
        <SchemaDiscoveryBoundary>
          <RefreshSchemaButton />
        </SchemaDiscoveryBoundary>
      </TestProvider>,
    );

    await userEvent.click(await screen.findByText("Refresh Schema"));
    await waitFor(() => {
      expect(
        store.get(schemaAtom).get(state.activeConfig.id)
          ?.lastEdgeConnectionSyncFail,
      ).toBe(true);
    });
    // Outlast several fetch cycles so a refetch loop would show up
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(fetchEdgeConnections).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Refresh Schema")).toBeInTheDocument();
  });
});

/** Stands in for the Schema view toolbar, which observes the sync queries. */
function RefreshSchemaButton() {
  const { refreshSchema } = useSchemaSync();
  return <button onClick={() => void refreshSchema()}>Refresh Schema</button>;
}
