// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";

import { getAppStore, schemaAtom } from "@/core";
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
        <MemoryRouter>
          <SchemaDiscoveryBoundary requireEdgeConnections>
            <div>Children</div>
          </SchemaDiscoveryBoundary>
        </MemoryRouter>
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
});
