import { atom, type WritableAtom } from "jotai";
import { atomWithDefault } from "jotai/utils";

export type SetStateAction<Value> = Value | ((prev: Value) => Value);

/** A persisted atom: synchronous reads and writes, seeded by a later load. */
export type PersistedAtom<Value> = WritableAtom<
  Value,
  [SetStateAction<Value>],
  void
> & {
  /** The key the value is stored under. */
  readonly storageKey: string;
};

/**
 * The loaded state of a persisted atom: the value read from the backing store
 * and the write-through that persists later changes. Built together because a
 * reconciling write needs the loaded value as its merge baseline.
 */
export type Hydration<Value> = {
  seed: Value;
  persist: (value: Value) => void;
};

/**
 * A persisted atom plus the two ways to seed it. `load` reads the backing
 * store; `seedDefault` seeds the default without I/O, for tests.
 */
export type PersistedAtomHandle<Value> = {
  atom: PersistedAtom<Value>;
  load: () => Promise<void>;
  seedDefault: () => void;
};

/**
 * Creates an atom that caches its value in memory and writes every change
 * through to an external store.
 *
 * The atom is defined synchronously but holds no value until `load` (or
 * `seedDefault`) runs. Reading it earlier throws, so a read that would show a
 * default before storage loads fails loudly instead of flashing it.
 *
 * Writes resolve a function update, short-circuit when the value is unchanged,
 * update the cache, then persist in the background. The setter returns `void`;
 * `persist` owns the outcome of its work.
 */
export function createWriteThroughAtom<Value>({
  key,
  debugLabel,
  load,
  seedDefault,
}: {
  key: string;
  debugLabel: string;
  load: () => Promise<Hydration<Value>>;
  seedDefault: () => Hydration<Value>;
}): PersistedAtomHandle<Value> {
  let hydration: Hydration<Value> | null = null;

  function requireHydration() {
    if (!hydration) {
      throw new Error(
        `Persisted atom "${key}" was read before loadPersistedState() finished.`,
      );
    }
    return hydration;
  }

  const baseAtom = atomWithDefault<Value>(() => requireHydration().seed);

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
      requireHydration().persist(nextValue);
    },
  );

  derivedAtom.debugLabel = debugLabel;

  return {
    atom: Object.assign(derivedAtom, { storageKey: key }),
    load: async () => {
      hydration = await load();
    },
    seedDefault: () => {
      hydration = seedDefault();
    },
  };
}
