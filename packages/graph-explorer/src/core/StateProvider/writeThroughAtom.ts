import { atom } from "jotai";

export type SetStateAction<Value> = Value | ((prev: Value) => Value);

/**
 * Creates an atom that caches its value in memory and writes every change
 * through to an external store via the `persist` callback.
 *
 * The atom is seeded synchronously, reads come from the in-memory cache, and
 * writes resolve a function update, short-circuit when the value is unchanged,
 * update the cache, then persist. Callers supply how seeding and persistence
 * map to their backing store (localForage, sessionStorage, etc.).
 *
 * The in-memory value updates synchronously and the setter returns `void`:
 * persistence happens in the background and the caller owns its outcome (the
 * `persist` callback must not let its work float — it handles its own failures).
 *
 * @param seed The initial value, already loaded from the backing store.
 * @param persist Writes a changed value to the backing store in the background.
 * @param debugLabel Label surfaced in Jotai devtools.
 */
export function createWriteThroughAtom<Value>(
  seed: Value,
  persist: (value: Value) => void,
  debugLabel: string,
) {
  const baseAtom = atom<Value>(seed);

  const derivedAtom = atom(
    get => get(baseAtom),
    (get, set, update: SetStateAction<Value>): void => {
      const prevValue = get(baseAtom);
      const nextValue =
        typeof update === "function"
          ? (update as (prev: Value) => Value)(prevValue)
          : update;

      if (prevValue === nextValue) {
        return;
      }

      set(baseAtom, nextValue);
      persist(nextValue);
    },
  );

  derivedAtom.debugLabel = debugLabel;

  return derivedAtom;
}
