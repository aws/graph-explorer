/**
 * `Object.entries` that preserves the key type rather than widening to
 * `string`. Sound only when the object has no extra keys beyond `keyof T` —
 * use at boundaries you control, not on values that may carry unknown keys.
 */
export function typedEntries<T extends object>(
  obj: T,
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
