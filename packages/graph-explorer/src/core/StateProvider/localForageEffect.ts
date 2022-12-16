import * as localForage from "localforage";
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

const localForageEffect = <T>(): AtomEffect<T> => ({
  setSelf,
  onSet,
  trigger,
  node,
}) => {
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

export default localForageEffect;
