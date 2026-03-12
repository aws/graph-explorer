import { z } from "zod";

import { logger } from "@/utils";
import { lucideIconToDataUri } from "@/utils/lucideIconUrl";

import type {
  EdgePreferencesStorageModel,
  UserStyling,
  VertexPreferencesStorageModel,
} from "./StateProvider/userPreferences";

import { createEdgeType, createVertexType } from "./entities";

/** Zod schema for a single vertex style entry in defaultStyling.json. */
const VertexStyleSchema = z
  .object({
    /** Lucide icon name (kebab-case). Resolved to an SVG data URI at runtime. */
    icon: z.string().optional(),
    /** Custom icon URL or base64 data URI. Takes precedence over `icon`. */
    iconUrl: z.string().optional(),
    /** MIME type for custom icon (e.g., "image/svg+xml", "image/png"). */
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

/** Zod schema for a single edge style entry in defaultStyling.json. */
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

/** Zod schema for the complete defaultStyling.json file. */
export const DefaultStylingSchema = z
  .object({
    vertices: z.record(z.string(), VertexStyleSchema).optional(),
    edges: z.record(z.string(), EdgeStyleSchema).optional(),
  })
  .strict();

export type DefaultStylingData = z.infer<typeof DefaultStylingSchema>;

/**
 * Fetches the default styling configuration from the server.
 * Returns null if no file is mounted (404) or if the data is invalid.
 */
export async function fetchDefaultStyling(): Promise<DefaultStylingData | null> {
  const defaultStylingPath = `${location.origin}/defaultStyling`;

  try {
    logger.debug("Fetching default styling from", defaultStylingPath);
    const response = await fetch(defaultStylingPath);

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("No default styling file found");
      } else {
        logger.warn(
          `Response status ${response.status} for default styling`,
          await response.text(),
        );
      }
      return null;
    }

    const data = await response.json();
    return parseDefaultStyling(data);
  } catch (error) {
    logger.warn("Failed to fetch default styling", error);
    return null;
  }
}

/**
 * Parses and validates default styling data from any source (server fetch or file import).
 * Returns null if the data is invalid.
 */
export function parseDefaultStyling(data: unknown): DefaultStylingData | null {
  const result = DefaultStylingSchema.safeParse(data);

  if (!result.success) {
    logger.warn("Failed to parse default styling data", result.error.flatten());
    return null;
  }

  return result.data;
}

/**
 * Resolves a DefaultStylingData object into a UserStyling object.
 *
 * This converts lucide icon names to data URIs and maps the record-based
 * format (keyed by type name) into the array-based format used by UserStyling.
 */
export async function resolveDefaultStyling(
  data: DefaultStylingData,
): Promise<UserStyling> {
  const vertices: VertexPreferencesStorageModel[] = [];
  const edges: EdgePreferencesStorageModel[] = [];

  if (data.vertices) {
    for (const [typeName, style] of Object.entries(data.vertices)) {
      const resolved: VertexPreferencesStorageModel = {
        type: createVertexType(typeName),
      };

      // Resolve lucide icon name to data URI if no explicit iconUrl is provided
      if (style.icon && !style.iconUrl) {
        const dataUri = await lucideIconToDataUri(style.icon);
        if (dataUri) {
          resolved.iconUrl = dataUri;
          resolved.iconImageType = "image/svg+xml";
        } else {
          logger.warn(
            `Unknown lucide icon name "${style.icon}" for vertex type "${typeName}"`,
          );
        }
      }

      // Copy over all other defined properties (using !== undefined to
      // preserve valid falsy values like 0 for borderWidth)
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
 * Converts a UserStyling object back to the DefaultStylingData format
 * suitable for export to a JSON file.
 *
 * Note: Lucide icon names cannot be reverse-resolved from data URIs,
 * so exported files will contain iconUrl data URIs instead of icon names.
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
