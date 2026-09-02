import { z } from "zod";

import {
  DEFAULT_LAYOUT_NAME,
  storedLayoutNameSchema,
} from "@/core/graphLayout";

import {
  DEFAULT_SIDEBAR_WIDTH,
  legacyStylingSidebarItemSchema,
} from "./graphViewLayoutDefaults";
import {
  parseSessionJson,
  type SessionValueCodec,
} from "./sessionScopedStorage";

/** Identifiers for the schema view sidebar panels. */
export const schemaViewSidebarItemSchema = z.enum(["details", "styles"]);
export type SchemaViewSidebarItem = z.infer<typeof schemaViewSidebarItemSchema>;
/** The sidebar panels as a readonly tuple, e.g. for random test selection. */
export const schemaViewSidebarItems = schemaViewSidebarItemSchema.options;

/**
 * The Schema View Layout. Plain JSON, so one schema serves both backings; it
 * also accepts a retired styling sidebar item an older version stored, and a
 * layout algorithm that is missing (pre-feature data) or unknown (e.g. removed).
 */
const schemaViewLayoutSchema = z.object({
  activeSidebarItem: z
    .union([schemaViewSidebarItemSchema, legacyStylingSidebarItemSchema])
    .nullable(),
  sidebar: z.object({ width: z.number() }),
  detailsAutoOpenOnSelection: z.boolean().optional(),
  layoutAlgorithm: storedLayoutNameSchema,
});
export type SchemaViewLayout = z.infer<typeof schemaViewLayoutSchema>;

/** Initial layout state used when no persisted layout exists. */
export const defaultSchemaViewLayout: SchemaViewLayout = {
  activeSidebarItem: "details",
  sidebar: { width: DEFAULT_SIDEBAR_WIDTH },
  detailsAutoOpenOnSelection: true,
  layoutAlgorithm: DEFAULT_LAYOUT_NAME,
};

/** Per-tab codec; the schema view layout is plain JSON. */
export const schemaViewLayoutCodec: SessionValueCodec<SchemaViewLayout> = {
  serialize: layout => JSON.stringify(layout),
  deserialize: raw => parseSessionJson(raw, schemaViewLayoutSchema),
  parseStored: stored => schemaViewLayoutSchema.parse(stored),
};
