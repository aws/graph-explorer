/**
 * A copy of `entry` without `fields`, or `null` when there are none to remove,
 * so callers can keep the original reference.
 */
export function omitFields<
  Field extends string,
  Entry extends Partial<Record<Field, unknown>>,
>(entry: Entry, fields: readonly Field[]): Entry | null {
  if (fields.length === 0) {
    return null;
  }
  const copy = { ...entry };
  for (const field of fields) {
    delete copy[field];
  }
  return copy;
}
