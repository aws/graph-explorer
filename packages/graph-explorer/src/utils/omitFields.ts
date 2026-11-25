/**
 * A copy of `entry` without `fields`, or `entry` itself when `fields` is
 * empty, so callers can tell nothing changed by reference.
 */
export function omitFields<
  Field extends string,
  Entry extends Partial<Record<Field, unknown>>,
>(entry: Entry, fields: readonly Field[]): Entry {
  if (fields.length === 0) {
    return entry;
  }
  const copy = { ...entry };
  for (const field of fields) {
    delete copy[field];
  }
  return copy;
}
