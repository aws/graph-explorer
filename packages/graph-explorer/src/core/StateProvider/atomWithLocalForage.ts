import localForage from "localforage";

import { persistThroughQueue } from "./persistence";
import { createWriteThroughAtom } from "./writeThroughAtom";

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
  const storage = createLocalForageStorage<T>(key, initialValue);
  const preloadValue = await storage.getItem();

  return createWriteThroughAtom<T>(
    preloadValue,
    nextValue => persistThroughQueue(key, () => storage.setItem(nextValue)),
    `atomWithLocalForage(${key})`,
  );
}
