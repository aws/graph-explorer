/** The two main content views that can be toggled on or off. */
export const toggleableViews = ["graph-viewer", "table-view"] as const;
export type ToggleableView = (typeof toggleableViews)[number];

/** Identifiers for the graph view sidebar panels. */
export const graphViewSidebarItems = [
  "search",
  "details",
  "filters",
  "expand",
  "styles",
  "namespaces",
] as const;
export type GraphViewSidebarItem = (typeof graphViewSidebarItems)[number];

/**
 * Legacy `activeSidebarItem` values, from when node and edge styling were two
 * separate sidebar panels. They now map to the combined "styles" panel.
 */
const LEGACY_STYLING_SIDEBAR_ITEMS = new Set([
  "nodes-styling",
  "edges-styling",
]);

/**
 * Normalizes a persisted sidebar item that a newer version has retired. The
 * schema view's sidebar items are a subset of the graph view's, so this bound
 * covers both views' persisted `activeSidebarItem` values.
 */
export function transformLegacySidebarItem<
  T extends GraphViewSidebarItem | null,
>(item: T): T | "styles" {
  return typeof item === "string" && LEGACY_STYLING_SIDEBAR_ITEMS.has(item)
    ? "styles"
    : item;
}

/** Persisted layout preferences for the graph view. */
export type GraphViewLayout = {
  activeSidebarItem: GraphViewSidebarItem | null;
  sidebar: { width: number };
  activeToggles: Set<ToggleableView>;
  tableView?: { height: number };
  detailsAutoOpenOnSelection?: boolean;
};

/** Default height for the table view panel in pixels. */
export const DEFAULT_TABLE_VIEW_HEIGHT = 300;

/** Default width for the graph view sidebar in pixels. */
export const DEFAULT_SIDEBAR_WIDTH = 400;

/** Initial layout state used when no persisted layout exists. */
export const defaultGraphViewLayout: GraphViewLayout = {
  activeToggles: new Set(["graph-viewer", "table-view"]),
  activeSidebarItem: "search",
  detailsAutoOpenOnSelection: true,
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  tableView: { height: DEFAULT_TABLE_VIEW_HEIGHT },
};

/** Normalizes a persisted graph view layout from an older app version. */
export function transformGraphViewLayout(
  layout: GraphViewLayout,
): GraphViewLayout {
  const activeSidebarItem = transformLegacySidebarItem(
    layout.activeSidebarItem,
  );
  return activeSidebarItem === layout.activeSidebarItem
    ? layout
    : { ...layout, activeSidebarItem };
}
