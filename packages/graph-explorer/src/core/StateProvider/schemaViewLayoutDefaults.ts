import {
  DEFAULT_GRAPH_LAYOUT,
  isLayoutName,
  type LayoutName,
} from "@/core/graphLayout";
import { logger } from "@/utils";

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
  layoutAlgorithm: LayoutName;
};

/** Initial layout state used when no persisted layout exists. */
export const defaultSchemaViewLayout: SchemaViewLayout = {
  activeSidebarItem: "details",
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  detailsAutoOpenOnSelection: true,
  layoutAlgorithm: DEFAULT_GRAPH_LAYOUT,
};

/** Normalizes a persisted schema view layout from an older app version. */
export function transformSchemaViewLayout(
  layout: SchemaViewLayout,
): SchemaViewLayout {
  const activeSidebarItem = transformLegacySidebarItem(
    layout.activeSidebarItem,
  );
  const layoutAlgorithm = resolveLayoutAlgorithm(layout.layoutAlgorithm);
  return activeSidebarItem === layout.activeSidebarItem &&
    layoutAlgorithm === layout.layoutAlgorithm
    ? layout
    : { ...layout, activeSidebarItem, layoutAlgorithm };
}

function resolveLayoutAlgorithm(value: unknown): LayoutName {
  if (value == null) return DEFAULT_GRAPH_LAYOUT;
  if (isLayoutName(value)) return value;
  logger.debug(
    `[schema-view-layout] Unrecognized layout algorithm; using "${DEFAULT_GRAPH_LAYOUT}"`,
    value,
  );
  return DEFAULT_GRAPH_LAYOUT;
}
