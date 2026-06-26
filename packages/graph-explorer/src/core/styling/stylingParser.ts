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

export type StylingExportPayload = {
  vertices: Record<string, VertexStyleFileEntry>;
  edges: Record<string, Omit<EdgePreferencesStorageModel, "type">>;
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

// --- Per-field zod schemas ---

/**
 * Imported icons must be either a Lucide reference or a base64-encoded data URI.
 * Remote URLs are rejected so importing never triggers outbound requests.
 */
const safeIconValue = z
  .string()
  .regex(
    /^(lucide:[a-z0-9-]+|data:image\/(svg\+xml|png|jpeg|gif|webp);base64,)/,
  );

type VertexStorageField = Exclude<keyof VertexPreferencesStorageModel, "type">;
type EdgeStorageField = Exclude<keyof EdgePreferencesStorageModel, "type">;

type FieldSchemas<StorageField extends string, Storage> = {
  [K in StorageField as K extends "iconUrl" ? "icon" : K]: z.ZodType<
    NonNullable<Storage[K & keyof Storage]>
  >;
};

const vertexFieldSchemas = {
  icon: safeIconValue,
  iconImageType: z.enum([
    "image/svg+xml",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ]),
  color: z.string(),
  displayLabel: z.string(),
  displayNameAttribute: z.string(),
  longDisplayNameAttribute: z.string(),
  shape: z.enum(SHAPE_STYLES),
  backgroundOpacity: z.number(),
  borderWidth: z.number(),
  borderColor: z.string(),
  borderStyle: z.enum(LINE_STYLES),
} satisfies FieldSchemas<VertexStorageField, VertexPreferencesStorageModel>;

const edgeFieldSchemas = {
  displayLabel: z.string(),
  displayNameAttribute: z.string(),
  labelColor: z.string(),
  labelBackgroundOpacity: z.number(),
  labelBorderColor: z.string(),
  labelBorderStyle: z.enum(LINE_STYLES),
  labelBorderWidth: z.number(),
  lineColor: z.string(),
  lineThickness: z.number(),
  lineStyle: z.enum(LINE_STYLES),
  sourceArrowStyle: z.enum(ARROW_STYLES),
  targetArrowStyle: z.enum(ARROW_STYLES),
} satisfies FieldSchemas<EdgeStorageField, EdgePreferencesStorageModel>;

// --- Top-level structural schema ---

const stylingPayloadSchema = z.object({
  vertices: z.record(z.string(), z.record(z.string(), z.unknown())),
  edges: z.record(z.string(), z.record(z.string(), z.unknown())),
});

// --- Parser ---

/**
 * Parses a styling payload (the `data` from the envelope). Throws
 * {@link StylingParseError} on structural failure (not a record of entries).
 * Per-field issues are salvaged and returned in `issues`.
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
  const vertexStyles = new Map<VertexType, VertexPreferencesStorageModel>();
  const edgeStyles = new Map<EdgeType, EdgePreferencesStorageModel>();

  for (const [typeName, entry] of Object.entries(structure.data.vertices)) {
    const resolved = salvageEntry(
      "vertex",
      typeName,
      entry,
      vertexFieldSchemas,
      issues,
    );
    if (Object.keys(resolved).length > 0) {
      vertexStyles.set(createVertexType(typeName), {
        type: createVertexType(typeName),
        ...resolved,
      } as VertexPreferencesStorageModel);
    }
  }

  for (const [typeName, entry] of Object.entries(structure.data.edges)) {
    const resolved = salvageEntry(
      "edge",
      typeName,
      entry,
      edgeFieldSchemas,
      issues,
    );
    if (Object.keys(resolved).length > 0) {
      edgeStyles.set(createEdgeType(typeName), {
        type: createEdgeType(typeName),
        ...resolved,
      } as EdgePreferencesStorageModel);
    }
  }

  return { vertexStyles, edgeStyles, issues };
}

// --- Generic salvaging entry parser ---

function salvageEntry(
  entityType: "vertex" | "edge",
  typeName: string,
  entry: Record<string, unknown>,
  fieldSchemas: Record<string, z.ZodType>,
  issues: ImportIssue[],
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(entry)) {
    if (!Object.hasOwn(fieldSchemas, field)) {
      issues.push({
        entityType,
        typeName,
        field,
        message: `unknown field "${field}"`,
      });
      continue;
    }

    const schema = fieldSchemas[field];
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      issues.push({
        entityType,
        typeName,
        field,
        message: formatZodError(parsed.error, value),
      });
      continue;
    }

    // The single field rename: file uses `icon`, storage uses `iconUrl`
    const storageField = field === "icon" ? "iconUrl" : field;
    resolved[storageField] = parsed.data;
  }

  return resolved;
}

function formatZodError(error: z.core.$ZodError, rawValue: unknown): string {
  const issue = error.issues[0];
  if (!issue) return `invalid value "${String(rawValue)}"`;

  if (issue.code === "invalid_value") {
    return `value "${String(rawValue)}" is not a valid option`;
  }
  if (issue.code === "invalid_type") {
    return `expected ${issue.expected}, got ${typeof rawValue}`;
  }
  if (issue.code === "invalid_format") {
    return `value "${String(rawValue)}" does not match the allowlist (lucide:<name> or data:image/*;base64,)`;
  }
  return `invalid value "${String(rawValue)}"`;
}
