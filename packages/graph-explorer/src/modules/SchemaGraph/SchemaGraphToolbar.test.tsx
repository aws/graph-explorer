// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { GraphProvider } from "@/components/Graph";
import { createEdgeType, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DbState, FakeExplorer, TestProvider } from "@/utils/testing";

import { SchemaGraphToolbar } from "./SchemaGraphToolbar";

describe("SchemaGraphToolbar", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  function renderToolbar(state: DbState) {
    const store = getAppStore();
    state.applyTo(store);

    return render(
      <TestProvider client={createQueryClient()} store={store}>
        <TooltipProvider>
          <GraphProvider>
            <SchemaGraphToolbar />
          </GraphProvider>
        </TooltipProvider>
      </TestProvider>,
    );
  }

  test("places the edge connection discovery status button next to Refresh Schema", async () => {
    vi.spyOn(explorer, "fetchEdgeConnections").mockImplementation(
      () => new Promise(() => {}),
    );

    const state = new DbState(explorer);
    state.activeSchema.edges = [
      { type: createEdgeType("knows"), attributes: [] },
    ];
    state.activeSchema.edgeConnections = undefined;
    state.activeSchema.lastEdgeConnectionSyncFail = false;

    renderToolbar(state);

    const refreshButton = await screen.findByRole("button", {
      name: /refresh\s*schema/i,
    });
    const statusButton = await screen.findByRole("button", {
      name: /not discovered/i,
    });

    expect(refreshButton.parentElement).toBe(statusButton.parentElement);
    const siblings = Array.from(refreshButton.parentElement?.children ?? []);
    expect(siblings.indexOf(refreshButton)).toBe(
      siblings.indexOf(statusButton) - 1,
    );
  });

  test("does not render the status button once discovery has succeeded", async () => {
    const state = new DbState(explorer);
    state.activeSchema.edges = [
      { type: createEdgeType("knows"), attributes: [] },
    ];
    state.activeSchema.edgeConnections = [];
    state.activeSchema.lastEdgeConnectionSyncFail = false;

    renderToolbar(state);

    await screen.findByRole("button", { name: /refresh\s*schema/i });

    expect(
      screen.queryByRole("button", { name: /not discovered/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /discovery failed/i }),
    ).not.toBeInTheDocument();
  });
});
