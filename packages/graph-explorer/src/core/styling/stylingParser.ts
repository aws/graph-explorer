import { z } from "zod";

import type { EdgeType, VertexType } from "@/core/entities";

import { createEdgeType, createVertexType } from "@/core/entities";
import {
  ARROW_STYLES,
  type EdgePreferencesStorageModel,
  LINE_STYLES,
  SHAPE_STYLES,
  type VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

// --- Format identity ---

/** The envelope `kind` discriminator for styling export files. */
export const STYLING_EXPORT_KIND = "styling-export";

/**
 * Format generation. A single integer that bumps only on a breaking change
 * (renamed or removed fields). Additive changes are made as optional fields and
 * do not bump it. Written to disk as `"1.0"` for historical reasons; read back
 * as the integer {@link STYLING_EXPORT_SUPPORTED_VERSION}.
 */
export const STYLING_EXPORT_VERSION = "1.0";
export const STYLING_EXPORT_SUPPORTED_VERSION = 1;

// --- Public types ---

export type ImportIssue = {
  entityType: "vertex" | "edge";
  typeName: string;
  field: string;
  message: string;
};

export type StylingParseResult = {
  vertexStyles: Map<VertexType, VertexPreferencesStorageModel>;
  edgeStyles: Map<EdgeType, EdgePreferencesStorageModel>;
  issues: ImportIssue[];
};

export class StylingParseError extends Error {
  readonly issues: z.core.$ZodIssue[] | undefined;

  constructor(message: string, issues?: z.core.$ZodIssue[]) {
    super(message);
    this.name = "StylingParseError";
    this.issues = issues;
  }
}

// --- File-format types ---

export type VertexStyleFileEntry = Omit<
  VertexPreferencesStorageModel,
  "type" | "iconUrl"
> & { icon?: string };

export type EdgeStyleFileEntry = Omit<EdgePreferencesStorageModel, "type">;

export type StylingExportPayload = {
  vertices: Record<string, VertexStyleFileEntry>;
  edges: Record<string, EdgeStyleFileEntry>;
};

export function toFileEntry(
  model: VertexPreferencesStorageModel,
): VertexStyleFileEntry {
  const { type: _type, iconUrl, ...rest } = model;
  const entry: VertexStyleFileEntry = { ...rest };
  if (iconUrl !== undefined) {
    entry.icon = iconUrl;
  }
  return entry;
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
  );

const imageType = z.enum([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

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
    iconImageType: imageType.optional(),
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

// --- Top-level structural schema ---

const stylingPayloadSchema = z.object({
  vertices: z.record(z.string(), z.record(z.string(), z.unknown())),
  edges: z.record(z.string(), z.record(z.string(), z.unknown())),
});

// --- Parser ---

/**
 * Parses a styling payload (the `data` from the envelope). Throws
 * {@link StylingParseError} on structural failure (not a record of entries).
 * Each entry is validated as a whole: any invalid known field drops the entire
 * entry (reported in `issues`); unknown fields are stripped silently. Empty
 * entries (no recognized fields) are skipped.
 */
export function parseStylingPayload(rawData: unknown): StylingParseResult {
  const structure = stylingPayloadSchema.safeParse(rawData);
  if (!structure.success) {
    throw new StylingParseError(
      "Invalid styling data structure",
      structure.error.issues,
    );
  }

  const issues: ImportIssue[] = [];

  const vertexStyles = parseEntries(
    "vertex",
    structure.data.vertices,
    vertexEntrySchema,
    createVertexType,
    issues,
  );
  const edgeStyles = parseEntries(
    "edge",
    structure.data.edges,
    edgeEntrySchema,
    createEdgeType,
    issues,
  );

  return { vertexStyles, edgeStyles, issues };
}

function parseEntries<Type, Fields extends object>(
  entityType: "vertex" | "edge",
  entries: Record<string, unknown>,
  entrySchema: z.ZodType<Fields, unknown>,
  createType: (typeName: string) => Type,
  issues: ImportIssue[],
): Map<Type, Fields & { type: Type }> {
  const styles = new Map<Type, Fields & { type: Type }>();
  for (const [typeName, entry] of Object.entries(entries)) {
    const parsed = entrySchema.safeParse(entry);
    if (!parsed.success) {
      issues.push(toEntryIssue(entityType, typeName, parsed.error));
      continue;
    }
    if (Object.keys(parsed.data).length === 0) {
      continue;
    }
    const type = createType(typeName);
    styles.set(type, { type, ...parsed.data });
  }
  return styles;
}

function toEntryIssue(
  entityType: "vertex" | "edge",
  typeName: string,
  error: z.core.$ZodError,
): ImportIssue {
  const issue = error.issues[0];
  const field = issue?.path.join(".") || "(entry)";
  return { entityType, typeName, field, message: describeZodIssue(issue) };
}

function describeZodIssue(issue: z.core.$ZodIssue | undefined): string {
  if (!issue) return "invalid value";
  if (issue.code === "invalid_value") return "value is not a valid option";
  if (issue.code === "invalid_type") return `expected ${issue.expected}`;
  if (issue.code === "invalid_format") {
    return "value does not match the allowlist (lucide:<name> or data:image/*;base64,)";
  }
  return "invalid value";
}
