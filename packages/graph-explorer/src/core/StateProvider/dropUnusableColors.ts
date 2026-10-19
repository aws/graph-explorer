import { logger } from "@/utils";
import { isAllowedColorValue } from "@/utils/isAllowedColorValue";

/** Keys of T named as a color: `color` or ending in `Color`. */
type ColorField<T> = {
  [K in keyof T]-?: K extends "color" | `${string}Color` ? K : never;
}[keyof T];

/**
 * `unknown` when `Field` covers every color field of `Entry`, so a newly added
 * color field fails to compile until the caller lists it.
 */
type ListsEveryColorField<Entry, Field> = [
  Exclude<ColorField<Entry>, Field>,
] extends [never]
  ? unknown
  : { missingColorFields: Exclude<ColorField<Entry>, Field> };

/**
 * Drops color fields that are not a color, so the app default applies.
 *
 * A blank color is dropped silently: styling files can carry `"color": ""`,
 * which would otherwise override the default through the spread in the resolve
 * functions and leave every consumer to render nothing. Anything else that is
 * not a color is a hand-edited or restored value, and is dropped with a
 * warning naming the start of it. Removing the field rather than substituting
 * one keeps the style following the default if it changes.
 *
 * Returns the cleaned copy, or `null` when nothing needed dropping.
 */
export function dropUnusableColors<
  Field extends string,
  Entry extends Partial<Record<Field, string>>,
>(
  entry: Entry,
  fields: readonly Field[] & ListsEveryColorField<Entry, NoInfer<Field>>,
  label: string,
): Entry | null {
  let cleaned: Entry | null = null;

  for (const field of fields) {
    const value = entry[field];
    if (value === undefined || isAllowedColorValue(value)) {
      continue;
    }
    if (value.trim()) {
      logger.warn(
        `Unsupported color "${value.slice(0, 100)}" in ${field} for "${label}", using the default`,
      );
    }
    cleaned ??= { ...entry };
    delete cleaned[field];
  }

  return cleaned;
}
