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
 * The in-memory value updates synchronously; the write returns the background
 * persistence promise so callers can await the value landing in storage when
 * they need to (the app does not, but tests do). It is never awaited in
 * production.
 *
 * @param seed The initial value, already loaded from the backing store.
 * @param persist Writes a changed value to the backing store, returning a
 * promise that resolves once it has landed.
 * @param debugLabel Label surfaced in Jotai devtools.
 */
export function createWriteThroughAtom<Value>(
  seed: Value,
  persist: (value: Value) => Promise<void>,
  debugLabel: string,
) {
  const baseAtom = atom<Value>(seed);

  const derivedAtom = atom(
    get => get(baseAtom),
    (get, set, update: SetStateAction<Value>): Promise<void> => {
      const prevValue = get(baseAtom);
      const nextValue =
        typeof update === "function"
          ? (update as (prev: Value) => Value)(prevValue)
          : update;

      if (prevValue === nextValue) {
        return Promise.resolve();
      }

      set(baseAtom, nextValue);
      return persist(nextValue);
    },
  );

  derivedAtom.debugLabel = debugLabel;

  return derivedAtom;
}
