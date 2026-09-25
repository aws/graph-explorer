// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createEdgeType, getAppStore, schemaAtom } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
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
    vi.spyOn(explorer, "fetchEdgeConnections").mockRejectedValue(
      new Error("Edge connection discovery failed"),
    );

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

    expect(screen.getByText("Children")).toBeInTheDocument();
  });
});
