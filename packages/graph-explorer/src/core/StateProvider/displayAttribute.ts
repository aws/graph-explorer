import { Vertex, Edge } from "@/core";
import { MISSING_DISPLAY_VALUE, formatDate } from "@/utils";
import { TextTransformer } from "@/hooks";
import { AttributeConfig } from "@/core";

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
      const config = typeAttributes.find(attr => attr.name === name) ?? null;
      const value = entity.attributes[name] ?? null;

      return mapToDisplayAttribute(name, value, config, textTransform);
    })
    .toArray()
    .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

  return sortedAttributes;
}

export function mapToDisplayAttribute(
  name: string,
  value: string | number | null,
  config: AttributeConfig | null,
  textTransform: TextTransformer
): DisplayAttribute {
  // Format value for display
  const isDate = config?.dataType === "Date" || config?.dataType === "g:Date";
  const displayValue =
    value === null
      ? MISSING_DISPLAY_VALUE
      : isDate
        ? formatDate(new Date(value))
        : String(value);

  return {
    name,
    displayLabel: config?.displayLabel || textTransform(name),
    displayValue,
  } as DisplayAttribute;
}
