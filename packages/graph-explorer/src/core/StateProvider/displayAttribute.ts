import { Vertex, Edge, AttributeConfig, EntityPropertyValue } from "@/core";
import { MISSING_DISPLAY_VALUE, formatDate } from "@/utils";
import { TextTransformer } from "@/hooks";

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
  value: EntityPropertyValue | null,
  config: AttributeConfig | null,
  textTransform: TextTransformer
): DisplayAttribute {
  return {
    name,
    displayLabel: textTransform(name),
    displayValue: mapToDisplayValue(value, config),
  } satisfies DisplayAttribute;
}

function mapToDisplayValue(
  value: EntityPropertyValue | null,
  config: AttributeConfig | null
) {
  if (value === null) {
    return MISSING_DISPLAY_VALUE;
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  const isDate = config?.dataType === "Date" || config?.dataType === "g:Date";
  if (isDate) {
    return formatDate(new Date(value));
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value;
}
