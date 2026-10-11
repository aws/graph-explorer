import type { StyleImportItem } from "./styleImportPlan";

/**
 * Which subset of the import list a filter tab shows. `all` is every item;
 * `nodes`/`edges` narrow by kind; `new` keeps types the user has not styled yet;
 * `existing` keeps types that already have a user-layer style the load would
 * replace.
 */
export type StyleImportFilter = "all" | "nodes" | "edges" | "new" | "existing";

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
    case "new":
      return item.status === "new";
    case "existing":
      return item.status === "existing";
  }
}

function matchesSearch(item: StyleImportItem, normalizedSearch: string) {
  return item.type.toLowerCase().includes(normalizedSearch);
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
  const normalizedSearch = search.toLowerCase();
  return items.filter(
    item =>
      matchesFilter(item, filter) && matchesSearch(item, normalizedSearch),
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
    new: 0,
    existing: 0,
  };
  const normalizedSearch = search.toLowerCase();
  for (const item of items) {
    if (!matchesSearch(item, normalizedSearch)) {
      continue;
    }
    counts.all++;
    if (item.kind === "vertex") {
      counts.nodes++;
    } else {
      counts.edges++;
    }
    if (item.status === "existing") {
      counts.existing++;
    } else {
      counts.new++;
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
