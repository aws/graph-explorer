import type { EdgeStyle, VertexStyle } from "@/core";
import type { TextTransformer } from "@/hooks";

import { LABELS, RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";

/**
 * The type-line text for a style preview: the display-type override, or the
 * transformed type (SPARQL IRIs become prefixed), falling back to the
 * missing-type label. Matches the canvas derivation in `displayTypeConfigs.ts`
 * so a preview reads the same as the node badge / edge label it stands in for.
 */
function typeText(
  style: VertexStyle | EdgeStyle,
  transform: TextTransformer,
): string {
  return style.displayLabel || transform(style.type) || LABELS.MISSING_TYPE;
}

/**
 * The single label an edge preview draws — also the node preview's name line.
 * A preview has no entity instance, so an attribute-derived name can't show a
 * real value; it shows the attribute name as a `<placeholder>` instead. The
 * reserved `types` attribute resolves to the type text since that needs no
 * instance data.
 */
export function edgePreviewLabel(
  style: VertexStyle | EdgeStyle,
  transform: TextTransformer,
): string {
  if (style.displayNameAttribute === RESERVED_TYPES_PROPERTY) {
    return typeText(style, transform);
  }
  if (style.displayNameAttribute === RESERVED_ID_PROPERTY) {
    return "<id>";
  }
  return `<${transform(style.displayNameAttribute)}>`;
}

/**
 * The two lines a node preview draws — a type line above the name line — to
 * match the canvas node badge, derived from the resolved style.
 */
export function vertexPreviewLabel(
  style: VertexStyle,
  transform: TextTransformer,
): {
  type: string;
  name: string;
} {
  return {
    type: typeText(style, transform),
    name: edgePreviewLabel(style, transform),
  };
}
