import localForage from "localforage";
import { AtomEffect, DefaultValue } from "recoil";
import { logger } from "../../utils";

localForage.config({
  name: "ge",
  version: 1.0,
  storeName: "graph-explorer",
});

// The first time that the atom is loaded from the store,
// mark as loaded to avoid side effect on asynchronous events
// that can load the atom state before it is recovered from the store
export const loadedAtoms: Set<string> = new Set();

const localForageEffect =
  <T>(): AtomEffect<T> =>
  ({ setSelf, onSet, trigger, node }) => {
    // If there's a persisted value - set it on load
    const loadPersisted = async () => {
      const savedValue = await localForage.getItem(node.key);

      if (savedValue != null) {
        setSelf(savedValue as T | DefaultValue);
        return;
      }
    };

    if (trigger === "get") {
      loadPersisted().then(() => {
        loadedAtoms.add(node.key);
      });
    }

    // Subscribe to state changes and persist them to localForage
    onSet((newValue: T, _: T | DefaultValue, isReset: boolean) => {
      isReset
        ? localForage.removeItem(node.key)
        : localForage.setItem(node.key, newValue);
    });
  };

// Reference docs:
// https://recoiljs.org/docs/guides/atom-effects#asynchronous-storage

/**
 * Loads and sets data asynchronously to localForage. Must be used within a
 * Suspense and ErrorBoundary.
 * @param key The key to use for the stored value.
 * @param options Options passed to `localForage.createInstance()`.
 * @returns An AtomEffect that will connect Recoil to localForage
 * asynchronously.
 */
export function asyncLocalForageEffect<T>(key: string): AtomEffect<T> {
  logger.debug(`[${key}] Async local forage effect created`);

  return ({ setSelf, onSet }) => {
    setSelf(
      localForage.getItem(key).then(
        savedValue =>
          savedValue != null
            ? (savedValue as T | DefaultValue)
            : new DefaultValue() // Abort initialization if no value was stored
      )
    );

    // Subscribe to state changes and persist them to localForage
    onSet((newValue: T, _, isReset) => {
      if (isReset) {
        logger.debug(`[${key}] Resetting value`, newValue);
        localForage.removeItem(key);
        return;
      }

      logger.debug(`[${key}] Setting value`, newValue);
      localForage.setItem(key, newValue);
    });
  };
}

export default localForageEffect;
