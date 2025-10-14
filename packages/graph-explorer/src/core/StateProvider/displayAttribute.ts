import { Vertex, Edge, AttributeConfig, EntityPropertyValue } from "@/core";
import { TextTransformer } from "@/hooks";
import { getDisplayValueForScalar } from "@/connector/entities";
import { sortAttributeByName } from "./sortAttributeByName";

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
    .toSorted(sortAttributeByName);

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
