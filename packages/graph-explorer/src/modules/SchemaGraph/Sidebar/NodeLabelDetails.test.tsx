// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { MemoryRouter } from "react-router";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import { createVertexType, getAppStore } from "@/core";
import { DbState } from "@/utils/testing";

import { NodeLabelDetails } from "./NodeLabelDetails";

function renderDetails(
  state: DbState,
  vertexType = createVertexType("Person"),
) {
  const store = getAppStore();
  state.applyTo(store);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <TooltipProvider>
            <NodeLabelDetails vertexType={vertexType} />
          </TooltipProvider>
        </Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("NodeLabelDetails", () => {
  // Pinned so the translated "edge-connections" label ("Relationships") is
  // deterministic; DbState otherwise picks a random query engine.
  function stateWithGremlinConnection() {
    const state = new DbState();
    if (state.activeConfig.connection) {
      state.activeConfig.connection.queryEngine = "gremlin";
    }
    return state;
  }

  test("shows edge connections were not discovered when the schema has never discovered them", () => {
    const state = stateWithGremlinConnection();
    state.activeSchema.edgeConnections = undefined;

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
});
