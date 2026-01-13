import { atom } from "jotai";
import localForage from "localforage";

localForage.config({
  name: "ge",
  version: 1.0,
  storeName: "graph-explorer",
});

// Create a custom storage for localForage
function createLocalForageStorage<T>(key: string, initialValue: T) {
  return {
    getItem: async () => {
      const value = await localForage.getItem<T>(key);
      return value ?? initialValue;
    },
    setItem: async (value: T) => {
      await localForage.setItem(key, value);
    },
    removeItem: async () => {
      await localForage.removeItem(key);
    },
  };
}

type SetStateAction<Value> = Value | ((prev: Value) => Value);

/**
 * Creates an atom that persists its value in localForage.
 *
 * This function is async and preloads the stored value before returning the
 * atom. This ensures the atom is immediately available with the correct value
 * on first read.
 *
 * After initialization, the atom provides synchronous read/write operations
 * while persistence happens asynchronously in the background.
 *
 * @param key The key to use for the stored value in localForage
 * @param initialValue The initial value if none is found in storage
 * @returns An atom that persists to localForage
 */
export async function atomWithLocalForage<T>(key: string, initialValue: T) {
  // Interactions with local forage
  const storage = createLocalForageStorage<T>(key, initialValue);
  const preloadValue = await storage.getItem();

  // Cached value
  const baseAtom = atom<T>(preloadValue);

  // Persist data to local forage on change
  const derivedAtom = atom(
    get => get(baseAtom),
    (get, set, update: SetStateAction<T>) => {
      const prevValue = get(baseAtom);
      const nextValue =
        typeof update === "function"
          ? (update as (prev: T) => T)(prevValue)
          : update;

      if (prevValue === nextValue) {
        return;
      }

      set(baseAtom, nextValue);
      storage.setItem(nextValue);
    },
  );

  derivedAtom.debugLabel = `atomWithLocalForage(${key})`;

  return derivedAtom;
}
