import { DEFAULT_SIDEBAR_WIDTH } from "./graphViewLayoutDefaults";

/** Identifiers for the schema view sidebar panels. */
export type SchemaViewSidebarItem =
  | "details"
  | "nodes-styling"
  | "edges-styling";

/** Persisted layout preferences for the schema view. */
export type SchemaViewLayout = {
  activeSidebarItem: SchemaViewSidebarItem | null;
  sidebar: { width: number };
  detailsAutoOpenOnSelection?: boolean;
};

/** Initial layout state used when no persisted layout exists. */
export const defaultSchemaViewLayout: SchemaViewLayout = {
  activeSidebarItem: "details",
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  detailsAutoOpenOnSelection: true,
};
