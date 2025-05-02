import localForage from "localforage";
import { atomWithStorage, unwrap } from "jotai/utils";

localForage.config({
  name: "ge",
  version: 1.0,
  storeName: "graph-explorer",
});

// Create a custom storage for localForage
function createLocalForageStorage<T>() {
  return {
    getItem: async (key: string, initialValue: T) => {
      const value = await localForage.getItem<T>(key);
      return value ?? initialValue;
    },
    setItem: async (key: string, value: T) => {
      await localForage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      await localForage.removeItem(key);
    },
  };
}

/**
 * Creates an atom that persists its value in localForage
 * @param key The key to use for the stored value
 * @param initialValue The initial value if none is found in storage
 * @returns An atom that persists to localForage
 */
export function atomWithLocalForage<Value>(initialValue: Value, key: string) {
  const storageAtom = atomWithStorage(
    key,
    initialValue,
    createLocalForageStorage<Value>(),
    { getOnInit: true }
  );
  return unwrap(storageAtom, prev => prev ?? initialValue);
}
