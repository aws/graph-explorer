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
  "styles",
  "namespaces",
]);
export type GraphViewSidebarItem = z.infer<typeof graphViewSidebarItemSchema>;
/** The sidebar panels as a readonly tuple, e.g. for random test selection. */
export const graphViewSidebarItems = graphViewSidebarItemSchema.options;

/**
 * Accepts the retired `activeSidebarItem` values from when node and edge
 * styling were two separate sidebar panels, mapping them to the combined
 * "styles" panel. Both views' stored layouts may hold them.
 */
export const legacyStylingSidebarItemSchema = z
  .enum(["nodes-styling", "edges-styling"])
  .transform(() => "styles" as const);

/** Default width for the graph view sidebar in pixels. */
export const DEFAULT_SIDEBAR_WIDTH = 400;

/**
 * The Graph View Layout as the shared breadcrumb stores it, declared once so the
 * runtime type and the parser cannot drift apart. It accepts the shapes older
 * versions wrote: a retired styling sidebar item, and no `sidebar` until the
 * user first resized it.
 */
const storedGraphViewLayoutSchema = z.object({
  activeSidebarItem: z
    .union([graphViewSidebarItemSchema, legacyStylingSidebarItemSchema])
    .nullable(),
  sidebar: z
    .object({ width: z.number() })
    .default(() => ({ width: DEFAULT_SIDEBAR_WIDTH })),
  activeToggles: z.set(toggleableViewSchema),
  tableView: z.object({ height: z.number() }).optional(),
  detailsAutoOpenOnSelection: z.boolean().optional(),
});
export type GraphViewLayout = z.infer<typeof storedGraphViewLayoutSchema>;

/**
 * The per-tab JSON form, where `activeToggles` is an array because a `Set` does
 * not survive `JSON.stringify`.
 */
const sessionGraphViewLayoutSchema = storedGraphViewLayoutSchema.extend({
  activeToggles: z
    .array(toggleableViewSchema)
    .transform(toggles => new Set(toggles)),
});

/** Default height for the table view panel in pixels. */
export const DEFAULT_TABLE_VIEW_HEIGHT = 300;

/** Initial layout state used when no persisted layout exists. */
export const defaultGraphViewLayout: GraphViewLayout = {
  activeToggles: new Set(["graph-viewer", "table-view"]),
  activeSidebarItem: "search",
  detailsAutoOpenOnSelection: true,
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  tableView: { height: DEFAULT_TABLE_VIEW_HEIGHT },
};

/** Per-tab codec; serializes the toggles Set as an array for JSON. */
export const graphViewLayoutCodec: SessionValueCodec<GraphViewLayout> = {
  serialize: layout =>
    JSON.stringify({
      ...layout,
      activeToggles: [...layout.activeToggles],
    }),
  deserialize: raw => parseSessionJson(raw, sessionGraphViewLayoutSchema),
  parseStored: stored => storedGraphViewLayoutSchema.parse(stored),
};
