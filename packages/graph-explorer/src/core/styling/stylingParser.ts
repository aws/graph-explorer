import type { SimplifyDeep } from "type-fest";

import { z } from "zod";

import type { EdgeType, VertexType } from "@/core/entities";

import { createEdgeType, createVertexType } from "@/core/entities";
import { FileEnvelopeError } from "@/core/fileEnvelope";
import {
  ARROW_STYLES,
  type EdgePreferencesStorageModel,
  LINE_STYLES,
  SHAPE_STYLES,
  type VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";
import { typedEntries } from "@/utils";

// --- Format identity ---

/** The envelope `kind` discriminator for styling export files. */
export const STYLING_EXPORT_KIND = "styling-export";

/**
 * Format generation. A single integer that bumps only on a breaking change
 * (renamed or removed fields). Additive changes are made as optional fields and
 * do not bump it. This is both the version written to new files and the newest
 * generation this build can read; files on disk from before the integer switch
 * carry the legacy `"1.0"` string, which the envelope normalizes to `1`.
 */
export const STYLING_EXPORT_VERSION = 1;

// --- Public types ---

/**
 * A structural problem with the file itself — a missing or non-object
 * `vertices`/`edges` container, or input that is not a styling payload at all.
 * Shown at the top of the import report, separate from per-entry issues.
 */
export type GeneralImportIssue = {
  scope: "general";
  /** Where in the file, e.g. `"vertices"` or `"(file)"`. */
  location: string;
  /** The rejected value, for display in the import report. */
  value: unknown;
  message: string;
};

/**
 * A problem with one vertex/edge entry — either an invalid field value or an
 * entry that is not an object (`field` is `"(entry)"`).
 */
export type EntryImportIssue = {
  scope: "entry";
  entityType: "vertex" | "edge";
  typeName: string;
  field: string;
  /** The rejected value, for display in the import report. */
  value: unknown;
  message: string;
};

export type ImportIssue = GeneralImportIssue | EntryImportIssue;

export type StylingParseResult = {
  vertexStyles: Map<VertexType, VertexPreferencesStorageModel>;
  edgeStyles: Map<EdgeType, EdgePreferencesStorageModel>;
};

/**
 * Thrown when the styling file fails validation. Import is atomic: a single
 * invalid value rejects the whole file and nothing is persisted. Carries every
 * offending location, already mapped for display.
 */
export class StylingParseError extends Error {
  readonly issues: ImportIssue[];

  constructor(issues: ImportIssue[]) {
    super("The styling file contains invalid values");
    this.name = "StylingParseError";
    this.issues = issues;
  }
}

// --- Per-entry zod schemas ---

/**
 * Imported icons must be either a Lucide reference or a base64-encoded data URI.
 * Remote URLs are rejected so importing never triggers outbound requests.
 */
const safeIconValue = z
  .string()
  .regex(
    /^(lucide:[a-z0-9-]+|data:image\/(svg\+xml|png|jpeg|gif|webp);base64,)/,
    {
      error:
        "value does not match the allowlist (lucide:<name> or data:image/*;base64,)",
    },
  );

/**
 * One vertex entry. Unknown fields are stripped (Zod's default), so a file with
 * extra keys imports without error and without storing them — in particular an
 * injected `iconUrl` is dropped, never bypassing the `icon` allowlist. The
 * `icon`→`iconUrl` rename to the storage model happens in `.transform()`, so it
 * stays at this seam.
 */
const vertexEntrySchema = z
  .object({
    icon: safeIconValue.optional(),
    // Matches storage's loose `string`. The upload seam fills this from the
    // browser's `file.type` (any `image/*` the OS reports), and no consumer
    // switches on its specific value — only SVG-vs-raster, gated on an exact
    // string match. The icon data itself is guarded by `safeIconValue`; this is
    // descriptive metadata, so it does not need its own allowlist.
    iconImageType: z.string().optional(),
    color: z.string().optional(),
    displayLabel: z.string().optional(),
    displayNameAttribute: z.string().optional(),
    longDisplayNameAttribute: z.string().optional(),
    shape: z.enum(SHAPE_STYLES).optional(),
    backgroundOpacity: z.number().optional(),
    borderWidth: z.number().optional(),
    borderColor: z.string().optional(),
    borderStyle: z.enum(LINE_STYLES).optional(),
  })
  .transform(
    ({ icon, ...rest }): Omit<VertexPreferencesStorageModel, "type"> =>
      icon !== undefined ? { ...rest, iconUrl: icon } : rest,
  );

const edgeEntrySchema = z.object({
  displayLabel: z.string().optional(),
  displayNameAttribute: z.string().optional(),
  labelColor: z.string().optional(),
  labelBackgroundOpacity: z.number().optional(),
  labelBorderColor: z.string().optional(),
  labelBorderStyle: z.enum(LINE_STYLES).optional(),
  labelBorderWidth: z.number().optional(),
  lineColor: z.string().optional(),
  lineThickness: z.number().optional(),
  lineStyle: z.enum(LINE_STYLES).optional(),
  sourceArrowStyle: z.enum(ARROW_STYLES).optional(),
  targetArrowStyle: z.enum(ARROW_STYLES).optional(),
});

// --- File-format types ---

/**
 * The on-disk shape of a vertex/edge entry — inferred from the import schema's
 * input so the file format has a single source of truth. The vertex entry uses
 * `icon`; the `icon`→`iconUrl` rename to the storage model happens in the
 * schema's `.transform()`, so {@link z.input} (pre-transform) is the file shape.
 */
export type VertexStyleFileEntry = SimplifyDeep<
  z.input<typeof vertexEntrySchema>
>;
export type EdgeStyleFileEntry = SimplifyDeep<z.input<typeof edgeEntrySchema>>;

export type StylingExportPayload = {
  vertices: Record<string, VertexStyleFileEntry>;
  edges: Record<string, EdgeStyleFileEntry>;
};

export function toVertexFileEntry(
  model: VertexPreferencesStorageModel,
): VertexStyleFileEntry {
  const { type: _type, iconUrl, ...rest } = model;
  // The file format uses `icon`; storage uses `iconUrl`. Every other field maps
  // straight across, so this rename is the only transformation on the way out.
  return iconUrl !== undefined ? { ...rest, icon: iconUrl } : rest;
}

export function toEdgeFileEntry(
  model: EdgePreferencesStorageModel,
): EdgeStyleFileEntry {
  const { type: _type, ...rest } = model;
  return rest;
}

// --- Top-level structural schema ---

/**
 * The whole file is validated in one pass: the entry schemas plug straight into
 * `z.record`, so a single invalid field produces a Zod issue whose `path`
 * (`["vertices", "Person", "color"]`) carries the entity, type, and field
 * needed to report it.
 */
const stylingPayloadSchema = z.object({
  vertices: z.record(z.string().transform(createVertexType), vertexEntrySchema),
  edges: z.record(z.string().transform(createEdgeType), edgeEntrySchema),
});

// --- Parser ---

/**
 * Parses a styling payload (the `data` from the envelope). Import is atomic: on
 * any validation failure this throws {@link StylingParseError} carrying every
 * offending location, and nothing is persisted. On success, unknown fields are
 * stripped silently and entries with no recognized fields are dropped.
 */
export function parseStylingPayload(rawData: unknown): StylingParseResult {
  const result = stylingPayloadSchema.safeParse(rawData, { reportInput: true });
  if (!result.success) {
    throw new StylingParseError(result.error.issues.map(toImportIssue));
  }
  return {
    vertexStyles: toStyleMap(result.data.vertices),
    edgeStyles: toStyleMap(result.data.edges),
  };
}

/**
 * Selects the payload parser for a styling file's format generation. Today only
 * generation 1 exists; a future breaking change adds its `case` here alongside
 * the old one. Routing through an explicit switch means a generation with no
 * parser fails loudly instead of being mis-parsed by the current schema (which
 * would silently strip renamed or retyped fields). The envelope's version guard
 * already rejects a generation newer than this build supports, so the `default`
 * is reached only when a supported generation is left unhandled here — a
 * programming error, surfaced rather than swallowed.
 */
export function parseStylingPayloadForVersion(
  version: number,
  rawData: unknown,
): StylingParseResult {
  switch (version) {
    case 1:
      return parseStylingPayload(rawData);
    default:
      throw new FileEnvelopeError(
        `No styling parser for format generation ${version}`,
      );
  }
}

/**
 * Brands each entry with its `type` and drops entries with no recognized
 * fields (an object of only unknown keys parses to `{}`).
 */
function toStyleMap<Type extends string, Fields extends object>(
  records: Record<Type, Fields>,
): Map<Type, Fields & { type: Type }> {
  const styles = new Map<Type, Fields & { type: Type }>();
  for (const [type, fields] of typedEntries(records)) {
    if (Object.keys(fields).length === 0) {
      continue;
    }
    styles.set(type, { type, ...fields });
  }
  return styles;
}

/**
 * Maps a Zod issue to an {@link ImportIssue}, classifying by path depth. A
 * field failure has the full `vertices`/`edges` → type → field shape; a
 * malformed entry stops at the type (reported with `field: "(entry)"`); a bad
 * top-level container is a general, file-level issue. The rejected `value` and
 * human `message` come straight from Zod — `reportInput` populates `input`, and
 * Zod's default messages (or a schema-level `error`) already read well.
 */
function toImportIssue(issue: z.core.$ZodIssue): ImportIssue {
  const [section, typeName, ...fieldPath] = issue.path;
  const value = issue.input;
  const message = issue.message;

  if (section !== "vertices" && section !== "edges") {
    return { scope: "general", location: "(file)", value, message };
  }
  if (typeName === undefined) {
    return { scope: "general", location: String(section), value, message };
  }
  return {
    scope: "entry",
    entityType: section === "vertices" ? "vertex" : "edge",
    typeName: String(typeName),
    field: fieldPath.length > 0 ? fieldPath.join(".") : "(entry)",
    value,
    message,
  };
}
