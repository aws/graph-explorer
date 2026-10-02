// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { createVertexType, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import {
  createRandomEdgeConnection,
  DbState,
  FakeExplorer,
  TestProvider,
} from "@/utils/testing";

import { NodeLabelDetails } from "./NodeLabelDetails";

describe("NodeLabelDetails", () => {
  let explorer: FakeExplorer;

  beforeEach(() => {
    explorer = new FakeExplorer();
  });

  function renderDetails(
    state: DbState,
    vertexType = createVertexType("Person"),
  ) {
    const store = getAppStore();
    state.applyTo(store);

    const queryClient = createQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();
    queryClient.setDefaultOptions({
      ...defaultOptions,
      queries: { ...defaultOptions.queries, retry: false },
    });

    return render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <NodeLabelDetails vertexType={vertexType} />
        </TooltipProvider>
      </TestProvider>,
    );
  }

  // Pinned so the translated "edge-connections" label ("Relationships") is
  // deterministic; DbState otherwise picks a random query engine.
  function stateWithGremlinConnection() {
    const state = new DbState(explorer);
    if (state.activeConfig.connection) {
      state.activeConfig.connection.queryEngine = "gremlin";
    }
    return state;
  }

  test("shows edge connections were not discovered when the schema has never discovered them", () => {
    // Hangs the fetch so the query stays pending, matching the never-run state
    // rather than racing FakeExplorer's near-instant resolution.
    vi.spyOn(explorer, "fetchEdgeConnections").mockImplementation(
      () => new Promise(() => {}),
    );

    const state = stateWithGremlinConnection();
    state.activeSchema.edgeConnections = undefined;
    state.activeSchema.lastEdgeConnectionSyncFail = false;

    renderDetails(state);

    expect(
      screen.getByText("Relationships were not discovered"),
    ).toBeInTheDocument();
  });

  test("shows no edge connections when discovery succeeded but found none for this vertex type", () => {
    const state = stateWithGremlinConnection();
    state.activeSchema.edgeConnections = [];

    renderDetails(state);

    expect(screen.getByText("No relationships")).toBeInTheDocument();
  });

  test("shows edge connections were not fully discovered when the failure flag is set even with partial connections excluding this vertex type", () => {
    const state = stateWithGremlinConnection();
    // Random connections use random vertex types, so they exclude "Person".
    state.activeSchema.edgeConnections = [createRandomEdgeConnection()];
    state.activeSchema.lastEdgeConnectionSyncFail = true;

    renderDetails(state);

    expect(
      screen.getByText("Relationships were not fully discovered"),
    ).toBeInTheDocument();
  });
});
