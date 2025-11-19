import localForage from "localforage";
import { atom } from "jotai";
import { logger } from "@/utils";

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
 * The atom provides synchronous read/write operations while persistence happens
 * asynchronously in the background. On first read, the atom loads the stored
 * value from localForage. If a write occurs during the load, it's queued and
 * takes precedence over the loaded value.
 *
 * @param key The key to use for the stored value in localForage
 * @param initialValue The initial value if none is found in storage
 * @returns An atom that persists to localForage
 */
export function atomWithLocalForage<T>(key: string, initialValue: T) {
  logger.debug(`atomWithLocalForage(${key}): init`, initialValue);
  // Cached value
  const baseAtom = atom(initialValue);

  // Interactions with local forage
  const storage = createLocalForageStorage(key, initialValue);

  // Track the last modification time
  let lastModificationTime = 0;

  // Preload data from local forage on mount
  baseAtom.onMount = setValue => {
    const mountTime = Date.now();
    logger.debug(`atomWithLocalForage(${key}): mount`, mountTime);

    (async () => {
      const item = await storage.getItem();
      // Only set the value if it hasn't been modified since mount
      if (lastModificationTime < mountTime) {
        logger.debug(`atomWithLocalForage(${key}): preload`, item);
        setValue(item);
      }
    })();
  };

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
        logger.debug(`atomWithLocalForage(${key}): no change`, nextValue);
        return;
      }
      lastModificationTime = Date.now();
      logger.debug(`atomWithLocalForage(${key}): update`, nextValue);
      set(baseAtom, nextValue);
      storage.setItem(nextValue);
    },
  );

  derivedAtom.debugLabel = `atomWithLocalForage(${key})`;

  return derivedAtom;
}
