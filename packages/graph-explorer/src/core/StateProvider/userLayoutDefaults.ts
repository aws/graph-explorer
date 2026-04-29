/** The two main content views that can be toggled on or off. */
export type ToggleableView = "graph-viewer" | "table-view";

/** Identifiers for the sidebar panels, or null when the sidebar is closed. */
export type SidebarItems =
  | "search"
  | "details"
  | "filters"
  | "expand"
  | "nodes-styling"
  | "edges-styling"
  | "namespaces"
  | null;

/** Persisted layout preferences for the main application shell. */
export type UserLayout = {
  activeToggles: Set<ToggleableView>;
  activeSidebarItem: SidebarItems;
  tableView?: {
    height: number;
  };
  sidebar?: {
    width: number;
  };
  detailsAutoOpenOnSelection?: boolean;
};

/** Default height for the table view panel in pixels. */
export const DEFAULT_TABLE_VIEW_HEIGHT = 300;

/** Default width for the sidebar panel in pixels. */
export const DEFAULT_SIDEBAR_WIDTH = 400;

/** Width of the sidebar when collapsed. */
export const CLOSED_SIDEBAR_WIDTH = 50;

/** Initial layout state used when no persisted layout exists. */
export const defaultUserLayout: UserLayout = {
  activeToggles: new Set(["graph-viewer", "table-view"]),
  activeSidebarItem: "search",
  detailsAutoOpenOnSelection: true,
  tableView: {
    height: DEFAULT_TABLE_VIEW_HEIGHT,
  },
};
