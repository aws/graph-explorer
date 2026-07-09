import {
  DEFAULT_SIDEBAR_WIDTH,
  transformLegacySidebarItem,
} from "./graphViewLayoutDefaults";

/** Identifiers for the schema view sidebar panels. */
export const schemaViewSidebarItems = ["details", "styles"] as const;
export type SchemaViewSidebarItem = (typeof schemaViewSidebarItems)[number];

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

/** Normalizes a persisted schema view layout from an older app version. */
export function transformSchemaViewLayout(
  layout: SchemaViewLayout,
): SchemaViewLayout {
  const activeSidebarItem = transformLegacySidebarItem(
    layout.activeSidebarItem,
  );
  return activeSidebarItem === layout.activeSidebarItem
    ? layout
    : { ...layout, activeSidebarItem };
}
