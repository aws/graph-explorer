/**
 * Checks if two sets are equal
 * @param set
 * @param compareSet
 */
const equal = <T>(set: Set<T>, compareSet: Set<T>) => {
  if (set.size !== compareSet.size) return false;
  for (const a of set) if (!compareSet.has(a)) return false;
  return true;
};

export default equal;
