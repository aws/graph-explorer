import { Vertex, Edge } from "@/@types/entities";
import { AttributeConfig } from "../ConfigurationProvider";
import { formatDate } from "@/utils";
import { MISSING_DISPLAY_VALUE } from "@/utils/constants";

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
  textTransform: (text?: string) => string
): DisplayAttribute[] {
  const nodeAttributeNames = Object.keys(entity.attributes);
  const typeAttributeNames = typeAttributes.map(attr => attr.name);
  const uniqueAttributeNames = new Set([
    ...nodeAttributeNames,
    ...typeAttributeNames,
  ]);
  const sortedAttributes = uniqueAttributeNames
    .values()
    .map(name => {
      const config = typeAttributes.find(attr => attr.name === name);

      // Format value for display
      const isDate =
        config?.dataType === "Date" || config?.dataType === "g:Date";
      const value = entity.attributes[name] ?? null;
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
    })
    .toArray()
    .toSorted((a, b) => a.displayLabel.localeCompare(b.displayLabel));

  return sortedAttributes;
}
