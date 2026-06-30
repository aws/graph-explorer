import { z } from "zod";

import {
  parseSessionJson,
  type SessionValueCodec,
} from "./sessionScopedStorage";

/** The two main content views that can be toggled on or off. */
export const toggleableViewSchema = z.enum(["graph-viewer", "table-view"]);
export type ToggleableView = z.infer<typeof toggleableViewSchema>;
/** The toggleable views as a readonly tuple, e.g. for random test selection. */
export const toggleableViews = toggleableViewSchema.options;

/** Identifiers for the graph view sidebar panels. */
export const graphViewSidebarItemSchema = z.enum([
  "search",
  "details",
  "filters",
  "expand",
  "nodes-styling",
  "edges-styling",
  "namespaces",
]);
export type GraphViewSidebarItem = z.infer<typeof graphViewSidebarItemSchema>;
/** The sidebar panels as a readonly tuple, e.g. for random test selection. */
export const graphViewSidebarItems = graphViewSidebarItemSchema.options;

/** Persisted layout preferences for the graph view. */
export type GraphViewLayout = {
  activeSidebarItem: GraphViewSidebarItem | null;
  sidebar: { width: number };
  activeToggles: Set<ToggleableView>;
  tableView?: { height: number };
  detailsAutoOpenOnSelection?: boolean;
};

/**
 * The graph view layout as JSON holds it: `activeToggles` is an array because a
 * `Set` does not survive `JSON.stringify`. The schema parses this shape and
 * rebuilds the runtime {@link GraphViewLayout}, so a hand-edited or stale
 * per-tab value with the wrong shape is rejected rather than seeding bad state.
 */
const serializedGraphViewLayoutSchema = z
  .object({
    activeSidebarItem: graphViewSidebarItemSchema.nullable(),
    sidebar: z.object({ width: z.number() }),
    activeToggles: z.array(toggleableViewSchema),
    tableView: z.object({ height: z.number() }).optional(),
    detailsAutoOpenOnSelection: z.boolean().optional(),
  })
  .transform(
    (value): GraphViewLayout => ({
      ...value,
      activeToggles: new Set(value.activeToggles),
    }),
  );

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

/** Per-tab session codec; serializes the toggles Set as an array for JSON. */
export const graphViewLayoutCodec: SessionValueCodec<GraphViewLayout> = {
  serialize: layout =>
    JSON.stringify({
      ...layout,
      activeToggles: [...layout.activeToggles],
    }),
  deserialize: raw => parseSessionJson(raw, serializedGraphViewLayoutSchema),
};
