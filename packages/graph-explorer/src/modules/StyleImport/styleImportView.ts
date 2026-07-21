import type { StyleImportItem } from "./styleImportPlan";

/**
 * Which subset of the import list a filter tab shows. `all` is every item;
 * `nodes`/`edges` narrow by kind; `conflicts` keeps only types that already
 * have a user-layer style the load would replace.
 */
export type StyleImportFilter = "all" | "nodes" | "edges" | "conflicts";

/** The per-tab counts, reflecting the active search. */
export type StyleImportFilterCounts = Record<StyleImportFilter, number>;

/** Whether a Select-All control over the visible items is on, off, or mixed. */
export type SelectAllState = "checked" | "unchecked" | "indeterminate";

function matchesFilter(item: StyleImportItem, filter: StyleImportFilter) {
  switch (filter) {
    case "all":
      return true;
    case "nodes":
      return item.kind === "vertex";
    case "edges":
      return item.kind === "edge";
    case "conflicts":
      return item.status === "conflict";
  }
}

function matchesSearch(item: StyleImportItem, search: string) {
  return item.type.toLowerCase().includes(search.toLowerCase());
}

/**
 * The items shown under the current filter tab and search term — the grid's
 * source of truth. Selection is tracked separately so a filtered-out item stays
 * selected; this only decides what is on screen.
 */
export function selectVisibleItems(
  items: StyleImportItem[],
  filter: StyleImportFilter,
  search: string,
): StyleImportItem[] {
  return items.filter(
    item => matchesFilter(item, filter) && matchesSearch(item, search),
  );
}

/**
 * The count each filter tab shows, narrowed by the active search so the tab
 * label and the grid it reveals always agree.
 */
export function filterCounts(
  items: StyleImportItem[],
  search: string,
): StyleImportFilterCounts {
  const counts: StyleImportFilterCounts = {
    all: 0,
    nodes: 0,
    edges: 0,
    conflicts: 0,
  };
  for (const item of items) {
    if (!matchesSearch(item, search)) {
      continue;
    }
    counts.all++;
    if (item.kind === "vertex") {
      counts.nodes++;
    } else {
      counts.edges++;
    }
    if (item.status === "conflict") {
      counts.conflicts++;
    }
  }
  return counts;
}

/**
 * The Select-All state for the currently-visible items only. An empty view or
 * no selection reads unchecked; a partial visible selection reads indeterminate.
 */
export function selectAllState(
  visibleItems: StyleImportItem[],
  isSelected: (item: StyleImportItem) => boolean,
): SelectAllState {
  if (visibleItems.length === 0) {
    return "unchecked";
  }
  const selectedCount = visibleItems.filter(isSelected).length;
  if (selectedCount === 0) {
    return "unchecked";
  }
  return selectedCount === visibleItems.length ? "checked" : "indeterminate";
}
