import type { Vertex, Edge, EntityPropertyValue } from "@/core";
import type { TextTransformer } from "@/hooks";
import { getDisplayValueForScalar } from "@/connector/entities";
import { sortAttributeByName } from "./sortAttributeByName";

/** Represents an attribute's display information after all transformations have been applied. */
export type DisplayAttribute = ReturnType<typeof mapToDisplayAttribute>;

/** Maps a `Vertex` or `Edge` instance's attributes to a list of `DisplayAttribute` instances using the schema and any user preferences. */
export function getSortedDisplayAttributes(
  entity: Vertex | Edge,
  textTransform: TextTransformer
): DisplayAttribute[] {
  return Object.entries(entity.attributes)
    .map(([name, value]) => mapToDisplayAttribute(name, value, textTransform))
    .toSorted(sortAttributeByName);
}

export function mapToDisplayAttribute(
  name: string,
  value: EntityPropertyValue,
  textTransform: TextTransformer
) {
  return {
    name,
    displayLabel: textTransform(name),
    displayValue: getDisplayValueForScalar(value),
  };
}
