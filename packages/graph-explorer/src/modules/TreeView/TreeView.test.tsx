// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import {
  type AppStore,
  createEdge,
  createVertex,
  edgesAtom,
  getAppStore,
  nodesAtom,
  nodesSelectedIdsAtom,
  toEdgeMap,
  toNodeMap,
  type Vertex,
} from "@/core";
import { DbState } from "@/utils/testing";

import TreeView from "./TreeView";

function vertex(id: string, type: string): Vertex {
  return createVertex({ id, types: [type] });
}

function containsEdge(source: Vertex, target: Vertex) {
  return createEdge({
    id: `${String(source.id)}-contains-${String(target.id)}`,
    type: "contains",
    sourceId: source.id,
    targetId: target.id,
  });
}

function renderTreeView(setup: (store: AppStore) => void) {
  const store = getAppStore();
  const dbState = new DbState();
  // Use a PG connection so the display id matches the raw vertex id exactly.
  dbState.activeConfig.connection!.queryEngine = "gremlin";
  dbState.applyTo(store);
  setup(store);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <TooltipProvider>
          <TreeView />
        </TooltipProvider>
      </Provider>
    </QueryClientProvider>,
  );

  return { store, ...result };
}

describe("TreeView", () => {
  test("shows an empty state when there are no notion groups", () => {
    renderTreeView(() => {});

    expect(
      screen.getByText(/No notion groups are on the graph/i),
    ).toBeVisible();
  });

  test("renders notion group roots and reveals children when expanded", async () => {
    const user = userEvent.setup();
    const group = vertex("group-1", "notionGroup");
    const notion = vertex("notion-1", "notion");

    renderTreeView(store => {
      store.set(nodesAtom, toNodeMap([group, notion]));
      store.set(edgesAtom, toEdgeMap([containsEdge(group, notion)]));
    });

    expect(screen.getByText("group-1")).toBeVisible();
    expect(screen.queryByText("notion-1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand" }));

    expect(screen.getByText("notion-1")).toBeVisible();
  });

  test("selects the vertex on the graph when a row is clicked", async () => {
    const user = userEvent.setup();
    const group = vertex("group-1", "notionGroup");

    const { store } = renderTreeView(s => {
      s.set(nodesAtom, toNodeMap([group]));
      s.set(edgesAtom, toEdgeMap([]));
    });

    await user.click(screen.getByText("group-1"));

    expect(store.get(nodesSelectedIdsAtom)).toEqual(new Set([group.id]));
  });
});
