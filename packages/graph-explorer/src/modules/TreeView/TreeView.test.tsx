// @vitest-environment happy-dom
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";
import { describe, expect, test, vi } from "vitest";

import { TooltipProvider } from "@/components";
import { createResultEdge } from "@/connector/entities";
import {
  type AppStore,
  createEdge,
  createVertex,
  type Edge,
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
  // Use a Gremlin connection so the display id matches the raw vertex id and so
  // the move mutation (which requires Gremlin) is enabled. The explorer carries
  // its own connection, so align it too.
  dbState.activeConfig.connection!.queryEngine = "gremlin";
  dbState.explorer.connection = {
    ...dbState.explorer.connection,
    queryEngine: "gremlin",
  };
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

  test("moves a notion to another group when dropped onto it", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const group1 = vertex("group-1", "notionGroup");
    const group2 = vertex("group-2", "notionGroup");
    const notion = vertex("notion-1", "notion");
    const oldEdge = containsEdge(group1, notion);

    // The database returns the freshly created `contains` edge.
    const rawQuerySpy = vi.spyOn(explorer, "rawQuery").mockResolvedValue({
      results: [
        createResultEdge({
          id: "group-2-contains-notion-1",
          type: "contains",
          sourceId: "group-2",
          targetId: "notion-1",
        }),
      ],
      rawResponse: null,
    });

    const { store } = renderTreeView(new DbState(explorer), s => {
      s.set(nodesAtom, toNodeMap([group1, group2, notion]));
      s.set(edgesAtom, toEdgeMap([oldEdge]));
    });

    // Reveal the notion under its current group.
    await user.click(screen.getByRole("button", { name: "Expand" }));

    dragRowOntoGroup("notion-1", "group-2");

    await waitFor(
      () => {
        const edges = store.get(edgesAtom);
        expect(edges.has(oldEdge.id)).toBe(false);
        const newEdge = findEdge(
          edges,
          edge => edge.sourceId === group2.id && edge.targetId === notion.id,
        );
        expect(newEdge).toBeDefined();
        expect(newEdge?.type).toBe("contains");
      },
      { timeout: 3000 },
    );
    expect(rawQuerySpy).toHaveBeenCalledTimes(1);
  });

  test("does nothing when a notion is dropped onto its current group", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const group = vertex("group-1", "notionGroup");
    const notion = vertex("notion-1", "notion");

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    renderTreeView(new DbState(explorer), s => {
      s.set(nodesAtom, toNodeMap([group, notion]));
      s.set(edgesAtom, toEdgeMap([containsEdge(group, notion)]));
    });

    await user.click(screen.getByRole("button", { name: "Expand" }));

    dragRowOntoGroup("notion-1", "group-1");

    expect(rawQuerySpy).not.toHaveBeenCalled();
  });

  test("moves a notion group into another group when dropped onto it", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const parent = vertex("group-1", "notionGroup");
    const target = vertex("group-2", "notionGroup");
    const subgroup = vertex("subgroup-1", "notionGroup");
    const oldEdge = containsEdge(parent, subgroup);

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery").mockResolvedValue({
      results: [
        createResultEdge({
          id: "group-2-contains-subgroup-1",
          type: "contains",
          sourceId: "group-2",
          targetId: "subgroup-1",
        }),
      ],
      rawResponse: null,
    });

    const { store } = renderTreeView(new DbState(explorer), s => {
      s.set(nodesAtom, toNodeMap([parent, target, subgroup]));
      s.set(edgesAtom, toEdgeMap([oldEdge]));
    });

    // Reveal the subgroup under its current parent.
    await user.click(screen.getByRole("button", { name: "Expand" }));

    dragRowOntoGroup("subgroup-1", "group-2");

    await waitFor(
      () => {
        const edges = store.get(edgesAtom);
        expect(edges.has(oldEdge.id)).toBe(false);
        const newEdge = findEdge(
          edges,
          edge => edge.sourceId === target.id && edge.targetId === subgroup.id,
        );
        expect(newEdge).toBeDefined();
      },
      { timeout: 3000 },
    );
    expect(rawQuerySpy).toHaveBeenCalledTimes(1);
  });

  test("does not move a group into one of its own subgroups", async () => {
    const user = userEvent.setup();
    const explorer = new FakeExplorer();
    const parent = vertex("group-1", "notionGroup");
    const child = vertex("group-2", "notionGroup");

    const rawQuerySpy = vi.spyOn(explorer, "rawQuery");

    renderTreeView(new DbState(explorer), s => {
      s.set(nodesAtom, toNodeMap([parent, child]));
      s.set(edgesAtom, toEdgeMap([containsEdge(parent, child)]));
    });

    // Reveal the child group, then try to drop its parent onto it.
    await user.click(screen.getByRole("button", { name: "Expand" }));

    dragRowOntoGroup("group-1", "group-2");

    expect(rawQuerySpy).not.toHaveBeenCalled();
  });
});

/** A minimal DataTransfer stand-in for jsdom/happy-dom drag events. */
function fakeDataTransfer() {
  return {
    effectAllowed: "",
    dropEffect: "",
    setData: vi.fn(),
    getData: vi.fn(),
  };
}

function dragRowOntoGroup(notionLabel: string, groupLabel: string) {
  const notionRow = screen
    .getByText(notionLabel)
    .closest('[draggable="true"]') as HTMLElement;
  const groupRow = screen.getByText(groupLabel).closest("div") as HTMLElement;
  const dataTransfer = fakeDataTransfer();

  fireEvent.dragStart(notionRow, { dataTransfer });
  fireEvent.dragOver(groupRow, { dataTransfer });
  fireEvent.drop(groupRow, { dataTransfer });
}

function findEdge(
  edges: Map<unknown, Edge>,
  predicate: (edge: Edge) => boolean,
): Edge | undefined {
  return [...edges.values()].find(predicate);
}
