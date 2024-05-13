import { ReadOnlySelectorOptions, RecoilValueReadOnly, selector } from "recoil";

// Inspired by: https://github.com/facebookexperimental/Recoil/issues/1416#issuecomment-1044953271

interface EqualReadOnlySelectorOptions<T> extends ReadOnlySelectorOptions<T> {
  /**
   * Comparer function to determine if values are equal.
   * @param latest The new value.
   * @param prior The old value.
   * @returns True if the values are equal.
   */
  equals: (latest: T, prior: T) => boolean;
}

/**
 * Recoil selector that uses an equality check with prior value
 * before returning. If the new value is the same as the prior
 * value, the prior value is returned. Recoil will not publish
 * a change to subscribers in this case.
 */
export function equalSelector<T>(
  options: EqualReadOnlySelectorOptions<T>
): RecoilValueReadOnly<T> {
  const inner = selector({
    key: `${options.key}_inner`,
    get: options.get,
  });

  let prior: T | undefined;

  return selector({
    key: options.key,
    get: ({ get }) => {
      const latest = get(inner);
      if (
        prior != null &&
        (latest === prior || options.equals(latest, prior))
      ) {
        return prior;
      }
      prior = latest;
      return latest as T;
    },
  });
}
