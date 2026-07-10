import { z } from "zod";

import { DEFAULT_SIDEBAR_WIDTH } from "./graphViewLayoutDefaults";
import {
  parseSessionJson,
  type SessionValueCodec,
} from "./sessionScopedStorage";

/** Identifiers for the schema view sidebar panels. */
export const schemaViewSidebarItemSchema = z.enum([
  "details",
  "nodes-styling",
  "edges-styling",
]);
export type SchemaViewSidebarItem = z.infer<typeof schemaViewSidebarItemSchema>;
/** The sidebar panels as a readonly tuple, e.g. for random test selection. */
export const schemaViewSidebarItems = schemaViewSidebarItemSchema.options;

/** Persisted layout preferences for the schema view. */
const schemaViewLayoutSchema = z.object({
  activeSidebarItem: schemaViewSidebarItemSchema.nullable(),
  sidebar: z.object({ width: z.number() }),
  detailsAutoOpenOnSelection: z.boolean().optional(),
});
export type SchemaViewLayout = z.infer<typeof schemaViewLayoutSchema>;

/** Initial layout state used when no persisted layout exists. */
export const defaultSchemaViewLayout: SchemaViewLayout = {
  activeSidebarItem: "details",
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  detailsAutoOpenOnSelection: true,
};

/** Per-tab session codec; the schema view layout is plain JSON. */
export const schemaViewLayoutCodec: SessionValueCodec<SchemaViewLayout> = {
  serialize: layout => JSON.stringify(layout),
  deserialize: raw => parseSessionJson(raw, schemaViewLayoutSchema),
};
