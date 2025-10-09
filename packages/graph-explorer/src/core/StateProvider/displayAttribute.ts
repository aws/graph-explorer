import {
  type Vertex,
  type Edge,
  type AttributeConfig,
  type EntityPropertyValue,
} from "@/core";
import { type TextTransformer } from "@/hooks";
import { getDisplayValueForScalar } from "@/connector/entities";

/** Represents an attribute's display information after all transformations have been applied. */
export type DisplayAttribute = {
  name: string;
  displayLabel: string;
  displayValue: string | null;
};

/** Maps a `Vertex` or `Edge` instance's attributes to a list of `DisplayAttribute` instances using the schema and any user preferences. */
export function getSortedDisplayAttributes(
  entity: Vertex | Edge,
  typeAttributes: AttributeConfig[],
  textTransform: TextTransformer
): DisplayAttribute[] {
  const entityAttributeNames = Object.keys(entity.attributes);
  const typeAttributeNames = typeAttributes.map(attr => attr.name);
  const uniqueAttributeNames = new Set([
    ...entityAttributeNames,
    ...typeAttributeNames,
  ]);
  const sortedAttributes = uniqueAttributeNames
    .values()
    .map(name => {
      const value = entity.attributes[name] ?? null;

      return mapToDisplayAttribute(name, value, textTransform);
    })
    .toArray()
    .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

  return sortedAttributes;
}

export function mapToDisplayAttribute(
  name: string,
  value: EntityPropertyValue | null,
  textTransform: TextTransformer
): DisplayAttribute {
  return {
    name,
    displayLabel: textTransform(name),
    displayValue: getDisplayValueForScalar(value),
  } satisfies DisplayAttribute;
}
