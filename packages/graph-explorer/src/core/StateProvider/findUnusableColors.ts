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

export type UnusableColor<Field> = { field: Field; value: string };

/**
 * The color fields of `entry` whose value is not a color, so the caller can
 * drop them and let the app default apply.
 *
 * A blank color counts: styling files can carry `"color": ""`, which would
 * otherwise override the default through the spread in the resolve functions
 * and leave every consumer to render nothing. Older files carry blanks, so
 * callers drop them without a warning.
 */
export function findUnusableColors<
  Field extends string,
  Entry extends Partial<Record<Field, string>>,
>(
  entry: Entry,
  fields: readonly Field[] & ListsEveryColorField<Entry, NoInfer<Field>>,
): UnusableColor<Field>[] {
  const found: UnusableColor<Field>[] = [];

  for (const field of fields) {
    const value = entry[field];
    if (value !== undefined && !isAllowedColorValue(value)) {
      found.push({ field, value });
    }
  }

  return found;
}
