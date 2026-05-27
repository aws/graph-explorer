import { z } from "zod";

import { logger } from "@/utils";
import { toLucideIconRef } from "@/utils/lucideIconUrl";

import type {
  EdgePreferencesStorageModel,
  UserStyling,
  VertexPreferencesStorageModel,
} from "./StateProvider/userPreferences";

import { createEdgeType, createVertexType } from "./entities";

/** Zod schema for a single vertex style entry in a styling file. */
const VertexStyleSchema = z
  .object({
    /**
     * Shorthand for a Lucide icon name (kebab-case). At parse time this is
     * converted to a `lucide:<name>` reference and stored in `iconUrl`.
     * Resolution to an SVG data URI happens at render time.
     */
    icon: z.string().optional(),
    /**
     * Full icon reference: `lucide:<name>`, a `data:` URI, or a plain URL.
     * Takes precedence over `icon` if both are provided.
     */
    iconUrl: z.string().optional(),
    /** MIME type for the icon (e.g., "image/svg+xml", "image/png"). */
    iconImageType: z.string().optional(),
    /** Hex color for the vertex (e.g., "#1565C0"). */
    color: z.string().optional(),
    /** Display label override. */
    displayLabel: z.string().optional(),
    /** Which vertex attribute to use as the display name. */
    displayNameAttribute: z.string().optional(),
    /** Which vertex attribute to use as the description. */
    longDisplayNameAttribute: z.string().optional(),
    /** Node shape. */
    shape: z
      .enum([
        "rectangle",
        "roundrectangle",
        "ellipse",
        "triangle",
        "pentagon",
        "hexagon",
        "heptagon",
        "octagon",
        "star",
        "barrel",
        "diamond",
        "vee",
        "rhomboid",
        "tag",
        "round-rectangle",
        "round-triangle",
        "round-diamond",
        "round-pentagon",
        "round-hexagon",
        "round-heptagon",
        "round-octagon",
        "round-tag",
        "cut-rectangle",
        "concave-hexagon",
      ])
      .optional(),
    /** Background opacity (0-1). */
    backgroundOpacity: z.number().min(0).max(1).optional(),
    /** Border width in pixels. */
    borderWidth: z.number().min(0).optional(),
    /** Hex color for the border. */
    borderColor: z.string().optional(),
    /** Border line style. */
    borderStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
  })
  .strict();

/** Zod schema for a single edge style entry in a styling file. */
const EdgeStyleSchema = z
  .object({
    /** Display label override. */
    displayLabel: z.string().optional(),
    /** Which edge attribute to use as the display name. */
    displayNameAttribute: z.string().optional(),
    /** Hex color for edge label background. */
    labelColor: z.string().optional(),
    /** Label background opacity (0-1). */
    labelBackgroundOpacity: z.number().min(0).max(1).optional(),
    /** Hex color for label border. */
    labelBorderColor: z.string().optional(),
    /** Label border style. */
    labelBorderStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
    /** Label border width in pixels. */
    labelBorderWidth: z.number().min(0).optional(),
    /** Hex color for the edge line. */
    lineColor: z.string().optional(),
    /** Edge line thickness in pixels. */
    lineThickness: z.number().min(0).optional(),
    /** Edge line style. */
    lineStyle: z.enum(["solid", "dashed", "dotted"]).optional(),
    /** Arrow style at the source end. */
    sourceArrowStyle: z
      .enum([
        "triangle",
        "triangle-tee",
        "circle-triangle",
        "triangle-cross",
        "triangle-backcurve",
        "tee",
        "vee",
        "square",
        "circle",
        "diamond",
        "none",
      ])
      .optional(),
    /** Arrow style at the target end. */
    targetArrowStyle: z
      .enum([
        "triangle",
        "triangle-tee",
        "circle-triangle",
        "triangle-cross",
        "triangle-backcurve",
        "tee",
        "vee",
        "square",
        "circle",
        "diamond",
        "none",
      ])
      .optional(),
  })
  .strict();

/** Zod schema for the complete styling file. */
export const DefaultStylingSchema = z
  .object({
    vertices: z.record(z.string(), VertexStyleSchema).optional(),
    edges: z.record(z.string(), EdgeStyleSchema).optional(),
  })
  .strict();

export type DefaultStylingData = z.infer<typeof DefaultStylingSchema>;

/**
 * Parses and validates a styling file. Returns null if the data is invalid.
 */
export function parseDefaultStyling(data: unknown): DefaultStylingData | null {
  const result = DefaultStylingSchema.safeParse(data);
  if (!result.success) {
    logger.warn("Failed to parse styling data", result.error.flatten());
    return null;
  }
  return result.data;
}

/**
 * Converts a parsed styling file into a `UserStyling` object suitable for
 * the user-styling atom.
 *
 * - `icon: <name>` shorthand is converted to `iconUrl: "lucide:<name>"`.
 *   Resolution to an actual SVG data URI happens at render time.
 * - Explicit `iconUrl` values pass through unchanged.
 * - The record-of-types format collapses into the array-of-types format.
 */
export function resolveDefaultStyling(data: DefaultStylingData): UserStyling {
  const vertices: VertexPreferencesStorageModel[] = [];
  const edges: EdgePreferencesStorageModel[] = [];

  if (data.vertices) {
    for (const [typeName, style] of Object.entries(data.vertices)) {
      const resolved: VertexPreferencesStorageModel = {
        type: createVertexType(typeName),
      };

      // Shorthand `icon: <name>` becomes a `lucide:<name>` reference unless
      // an explicit iconUrl is also provided.
      if (style.icon && !style.iconUrl) {
        resolved.iconUrl = toLucideIconRef(style.icon);
        resolved.iconImageType = "image/svg+xml";
      }

      if (style.iconUrl !== undefined) resolved.iconUrl = style.iconUrl;
      if (style.iconImageType !== undefined)
        resolved.iconImageType = style.iconImageType;
      if (style.color !== undefined) resolved.color = style.color;
      if (style.displayLabel !== undefined)
        resolved.displayLabel = style.displayLabel;
      if (style.displayNameAttribute !== undefined)
        resolved.displayNameAttribute = style.displayNameAttribute;
      if (style.longDisplayNameAttribute !== undefined)
        resolved.longDisplayNameAttribute = style.longDisplayNameAttribute;
      if (style.shape !== undefined) resolved.shape = style.shape;
      if (style.backgroundOpacity !== undefined)
        resolved.backgroundOpacity = style.backgroundOpacity;
      if (style.borderWidth !== undefined)
        resolved.borderWidth = style.borderWidth;
      if (style.borderColor !== undefined)
        resolved.borderColor = style.borderColor;
      if (style.borderStyle !== undefined)
        resolved.borderStyle = style.borderStyle;

      vertices.push(resolved);
    }
  }

  if (data.edges) {
    for (const [typeName, style] of Object.entries(data.edges)) {
      const resolved: EdgePreferencesStorageModel = {
        type: createEdgeType(typeName),
        ...style,
      };
      edges.push(resolved);
    }
  }

  return { vertices, edges };
}

/**
 * Converts the user styling atom back into the file format used by import.
 * Round-trips cleanly: `lucide:<name>` references stay symbolic, custom
 * uploads stay as data URIs.
 */
export function userStylingToExportFormat(
  styling: UserStyling,
): DefaultStylingData {
  const result: DefaultStylingData = {};

  if (styling.vertices?.length) {
    result.vertices = {};
    for (const vertex of styling.vertices) {
      const { type, ...rest } = vertex;
      result.vertices[type] = rest;
    }
  }

  if (styling.edges?.length) {
    result.edges = {};
    for (const edge of styling.edges) {
      const { type, ...rest } = edge;
      result.edges[type] = rest;
    }
  }

  return result;
}
