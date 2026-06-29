/** The two main content views that can be toggled on or off. */
export type ToggleableView = "graph-viewer" | "table-view";

/** Identifiers for the graph view sidebar panels. */
export type GraphViewSidebarItem =
  | "search"
  | "details"
  | "filters"
  | "expand"
  | "nodes-styling"
  | "edges-styling"
  | "namespaces";

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

/** Width of the sidebar when collapsed to just the icon strip. */
export const CLOSED_SIDEBAR_WIDTH = 50;

/** Initial layout state used when no persisted layout exists. */
export const defaultGraphViewLayout: GraphViewLayout = {
  activeToggles: new Set(["graph-viewer", "table-view"]),
  activeSidebarItem: "search",
  detailsAutoOpenOnSelection: true,
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  tableView: { height: DEFAULT_TABLE_VIEW_HEIGHT },
};
