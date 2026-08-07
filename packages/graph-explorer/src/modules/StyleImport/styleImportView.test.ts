import { createEdgeType, createVertexType } from "@/core/entities";
import {
  resolveEdgeStyle,
  resolveVertexStyle,
} from "@/core/StateProvider/graphStyles";

import type {
  EdgeStyleImportItem,
  StyleImportItem,
  StyleImportStatus,
  VertexStyleImportItem,
} from "./styleImportPlan";

import {
  filterCounts,
  selectAllState,
  selectVisibleItems,
} from "./styleImportView";

function vertexItem(
  name: string,
  status: StyleImportStatus = "new",
): VertexStyleImportItem {
  const type = createVertexType(name);
  const incoming = { type };
  return {
    kind: "vertex",
    variant: "base",
    type,
    status,
    incoming,
    incomingStyle: resolveVertexStyle(type, incoming),
    currentStyle: resolveVertexStyle(type),
  };
}

function edgeItem(
  name: string,
  status: StyleImportStatus = "new",
): EdgeStyleImportItem {
  const type = createEdgeType(name);
  const incoming = { type };
  return {
    kind: "edge",
    variant: "base",
    type,
    status,
    incoming,
    incomingStyle: resolveEdgeStyle(type, incoming),
    currentStyle: resolveEdgeStyle(type),
  };
}

describe("selectVisibleItems", () => {
  test("returns everything for the all filter with no search", () => {
    const items = [vertexItem("Airport"), edgeItem("route")];

    expect(selectVisibleItems(items, "all", "")).toStrictEqual(items);
  });

  test("keeps only vertices for the nodes filter", () => {
    const airport = vertexItem("Airport");
    const items = [airport, edgeItem("route")];

    expect(selectVisibleItems(items, "nodes", "")).toStrictEqual([airport]);
  });

  test("keeps only edges for the edges filter", () => {
    const route = edgeItem("route");
    const items = [vertexItem("Airport"), route];

    expect(selectVisibleItems(items, "edges", "")).toStrictEqual([route]);
  });

  test("keeps only existing-style types across both kinds for the existing filter", () => {
    const existingVertex = vertexItem("Airport", "existing");
    const existingEdge = edgeItem("route", "existing");
    const items = [
      existingVertex,
      vertexItem("Country", "new"),
      existingEdge,
      edgeItem("contains", "new"),
    ];

    expect(selectVisibleItems(items, "existing", "")).toStrictEqual([
      existingVertex,
      existingEdge,
    ]);
  });

  test("keeps only brand-new types across both kinds for the new filter", () => {
    const newVertex = vertexItem("Country", "new");
    const newEdge = edgeItem("contains", "new");
    const items = [
      vertexItem("Airport", "existing"),
      newVertex,
      edgeItem("route", "existing"),
      newEdge,
    ];

    expect(selectVisibleItems(items, "new", "")).toStrictEqual([
      newVertex,
      newEdge,
    ]);
  });

  test("narrows by case-insensitive substring on the type name", () => {
    const airport = vertexItem("Airport");
    const items = [airport, vertexItem("Country")];

    expect(selectVisibleItems(items, "all", "port")).toStrictEqual([airport]);
    expect(selectVisibleItems(items, "all", "AIR")).toStrictEqual([airport]);
  });

  test("composes the active filter with the search term", () => {
    const airRoute = edgeItem("airRoute");
    const items = [vertexItem("Airport"), airRoute, edgeItem("contains")];

    expect(selectVisibleItems(items, "edges", "air")).toStrictEqual([airRoute]);
  });
});

describe("filterCounts", () => {
  test("counts each tab independently with no search", () => {
    const items = [
      vertexItem("Airport", "existing"),
      vertexItem("Country", "new"),
      edgeItem("route", "existing"),
    ];

    expect(filterCounts(items, "")).toStrictEqual({
      all: 3,
      nodes: 2,
      edges: 1,
      new: 1,
      existing: 2,
    });
  });

  test("reflects the active search in every tab count", () => {
    const items = [
      vertexItem("Airport", "existing"),
      vertexItem("Country", "new"),
      edgeItem("route", "existing"),
    ];

    // Only "Airport" matches, and it is both a node with an existing style.
    expect(filterCounts(items, "air")).toStrictEqual({
      all: 1,
      nodes: 1,
      edges: 0,
      new: 0,
      existing: 1,
    });
  });
});

describe("selectAllState", () => {
  const airport = vertexItem("Airport");
  const country = vertexItem("Country");
  const route = edgeItem("route");

  function selectedSet(...items: StyleImportItem[]) {
    const selected = new Set(items);
    return (item: StyleImportItem) => selected.has(item);
  }

  test("is unchecked when no visible item is selected", () => {
    expect(selectAllState([airport, country], selectedSet())).toBe("unchecked");
  });

  test("is checked when every visible item is selected", () => {
    expect(
      selectAllState([airport, country], selectedSet(airport, country)),
    ).toBe("checked");
  });

  test("is indeterminate when some but not all visible items are selected", () => {
    expect(selectAllState([airport, country], selectedSet(airport))).toBe(
      "indeterminate",
    );
  });

  test("ignores selection outside the visible subset", () => {
    // route is selected but not visible, so the visible nodes read as unchecked.
    expect(selectAllState([airport, country], selectedSet(route))).toBe(
      "unchecked",
    );
  });

  test("is unchecked when there are no visible items", () => {
    expect(selectAllState([], selectedSet(airport))).toBe("unchecked");
  });
});
