/**
 * Set operations implemented with native array methods.
 *
 * These replace `Set.prototype.difference`, `Set.prototype.union`, and
 * `Set.prototype.isSubsetOf`, which are not available in all supported browsers.
 */

export function setDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  return new Set([...a].filter(x => !b.has(x)));
}

export function setUnion<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  return new Set([...a, ...b]);
}

export function setIsSubsetOf<T>(
  a: ReadonlySet<T>,
  b: ReadonlySet<T>,
): boolean {
  return [...a].every(x => b.has(x));
}
