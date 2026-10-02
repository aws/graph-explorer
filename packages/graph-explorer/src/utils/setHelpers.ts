/**
 * Set operations implemented without ES2025 Set methods.
 *
 * These replace `Set.prototype.difference`, `Set.prototype.union`, and
 * `Set.prototype.isSubsetOf`, which are not available in all supported browsers.
 */

export function setDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (!b.has(item)) {
      result.add(item);
    }
  }
  return result;
}

export function setUnion<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>(a);
  for (const item of b) {
    result.add(item);
  }
  return result;
}

export function setIsSubsetOf<T>(
  a: ReadonlySet<T>,
  b: ReadonlySet<T>,
): boolean {
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}
