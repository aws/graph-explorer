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
 * Creates an atom that persists its value in localForage.
 *
 * The read side of the atom is synchronous (does not suspend) and will use the
 * previous value or initial while the current value is asynchronously loading.
 * @param initialValue The initial value if none is found in storage
 * @param key The key to use for the stored value
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

/**
 * Creates an atom that persists its value in localForage.
 *
 * Returns both the old style atom where the read side is synchronous, and the
 * fully asynchronous version that will cause suspension.
 * @param initialValue The initial value if none is found in storage
 * @param key The key to use for the stored value
 * @returns an array where the first item is an atom where the read side is
 * synchronous and the second item is the fully asynchronous atom.
 */
export function atomWithLocalForageAsync<Value>(
  initialValue: Value,
  key: string
) {
  const storageAtom = atomWithStorage(
    key,
    initialValue,
    createLocalForageStorage<Value>(),
    { getOnInit: true }
  );
  const syncStyle = unwrap(storageAtom, prev => prev ?? initialValue);
  return [syncStyle, storageAtom] as const;
}
