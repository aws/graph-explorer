import localForage from "localforage";
import { AtomEffect, DefaultValue } from "recoil";

localForage.config({
  name: "ge",
  version: 1.0,
  storeName: "graph-explorer",
});

// The first time that the atom is loaded from the store,
// mark as loaded to avoid side effect on asynchronous events
// that can load the atom state before it is recovered from the store
export const loadedAtoms: Set<string> = new Set();

/**
 * Loads and sets data asynchronously to localForage. Must be used within a
 * Suspense and ErrorBoundary.
 * @param key The key to use for the stored value.
 * @param options Options passed to `localForage.createInstance()`.
 * @returns An AtomEffect that will connect Recoil to localForage
 * asynchronously.
 */
export function localForageEffect<T>(key: string): AtomEffect<T> {
  return ({ setSelf, onSet, trigger }) => {
    // Load saved value
    if (trigger === "get") {
      setSelf(
        localForage.getItem<T>(key).then(savedValue => {
          return savedValue != null ? savedValue : new DefaultValue();
        })
      );
    }

    // Subscribe to state changes and persist them to localForage
    onSet((newValue, _, isReset) => {
      if (isReset) {
        localForage.removeItem(key);
      } else {
        localForage.setItem(key, newValue);
      }
    });
  };
}

// Reference docs:
// https://recoiljs.org/docs/guides/atom-effects#asynchronous-storage
