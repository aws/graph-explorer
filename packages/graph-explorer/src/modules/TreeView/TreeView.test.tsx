// @vitest-environment happy-dom
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
import { createQueryClient } from "@/core/queryClient";
import { DbState, FakeExplorer } from "@/utils/testing";

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

function renderTreeView(dbState: DbState, setup?: (store: AppStore) => void) {
  const store = getAppStore();
  // Use a PG connection so the display id matches the raw vertex id exactly.
  dbState.activeConfig.connection!.queryEngine = "gremlin";
  dbState.applyTo(store);
  setup?.(store);

  const queryClient = createQueryClient();
  const defaultOptions = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({
    ...defaultOptions,
    queries: { ...defaultOptions.queries, retry: false },
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
    renderTreeView(new DbState(new FakeExplorer()));

    expect(
      screen.getByText(/No notion groups are on the graph/i),
    ).toBeVisible();
  });

  test("renders notion group roots and reveals children when expanded", async () => {
    const user = userEvent.setup();
    const group = vertex("group-1", "notionGroup");
    const notion = vertex("notion-1", "notion");

    renderTreeView(new DbState(new FakeExplorer()), store => {
      store.set(nodesAtom, toNodeMap([group, notion]));
      store.set(edgesAtom, toEdgeMap([containsEdge(group, notion)]));
    });

    expect(screen.getByText("group-1")).toBeVisible();
    expect(screen.queryByText("notion-1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand" }));

    expect(screen.getByText("notion-1")).toBeVisible();
  });

  test("shows the count of unexpanded relationships on a notion group", async () => {
    const explorer = new FakeExplorer();
    const group = vertex("group-1", "notionGroup");
    const notionA = vertex("notion-1", "notion");
    const notionB = vertex("notion-2", "notion");

    // The database knows about the group and its two `contains` neighbors.
    explorer.addVertex(group);
    explorer.addVertex(notionA);
    explorer.addVertex(notionB);
    explorer.addEdge(containsEdge(group, notionA));
    explorer.addEdge(containsEdge(group, notionB));

    renderTreeView(new DbState(explorer), store => {
      // Only the group is on the canvas, so both neighbors are unexpanded.
      store.set(nodesAtom, toNodeMap([group]));
      store.set(edgesAtom, toEdgeMap([]));
    });

    expect(await screen.findByText("2")).toBeVisible();
  });

  test("expands the vertex's neighbors into the graph on double click", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const group = vertex("group-1", "notionGroup");
    const notion = vertex("notion-1", "notion");

    explorer.addVertex(group);
    explorer.addVertex(notion);
    explorer.addEdge(containsEdge(group, notion));

    const { store } = renderTreeView(new DbState(explorer), s => {
      s.set(nodesAtom, toNodeMap([group]));
      s.set(edgesAtom, toEdgeMap([]));
    });

    // The neighbor is not in the graph yet.
    expect(store.get(nodesAtom).has(notion.id)).toBe(false);

    await user.dblClick(screen.getByText("group-1"));

    // Double click runs the graph Expand action, loading the neighbor.
    await waitFor(() => {
      expect(store.get(nodesAtom).has(notion.id)).toBe(true);
    });
  });

  test("selects the vertex on the graph when a row is clicked", async () => {
    const user = userEvent.setup();
    const group = vertex("group-1", "notionGroup");

    const { store } = renderTreeView(new DbState(new FakeExplorer()), s => {
      s.set(nodesAtom, toNodeMap([group]));
      s.set(edgesAtom, toEdgeMap([]));
    });

    await user.click(screen.getByText("group-1"));

    expect(store.get(nodesSelectedIdsAtom)).toEqual(new Set([group.id]));
  });
});
