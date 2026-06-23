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

/**
 * Merges this tab's change (`next`, against its last-persisted `previous`
 * baseline) onto the freshly-read stored value (`persisted`). See
 * {@link atomWithReconciledLocalForage} for how and why this is applied.
 */
export type ReconcileWrite<T> = (args: {
  persisted: T;
  previous: T;
  next: T;
}) => T;

/**
 * Like {@link atomWithLocalForage}, but reconciles each persist against the
 * value currently in storage instead of overwriting it blindly.
 *
 * The reconciliation lives entirely inside the flush thunk handed to the shared
 * write queue: on each persist it re-reads the live stored value, merges this
 * tab's change onto it via `reconcile`, then writes the result. Because the
 * queue serializes and coalesces writes per key, concurrent persists never
 * interleave and rapid writes collapse to the latest value.
 *
 * The merge baseline (`previous`) is the value this tab last persisted; it
 * advances only once a write lands, so coalesced intermediate writes never
 * shift it. This keeps the seam narrow — only atoms backing genuinely shared
 * collections opt in, and the plain {@link atomWithLocalForage} stays a blind
 * whole-value write.
 *
 * @param key The key to use for the stored value in localForage
 * @param initialValue The initial value if none is found in storage
 * @param reconcile Merges this tab's change onto the freshly-read stored value
 * @returns An atom that reconciles then persists to localForage
 */
export async function atomWithReconciledLocalForage<T>(
  key: string,
  initialValue: T,
  reconcile: ReconcileWrite<T>,
) {
  const storage = createLocalForageStorage<T>(key, initialValue);
  const preloadValue = await storage.getItem();

  // The last value this tab persisted; the baseline the reconcile diff is
  // computed against. Advances only after a write lands.
  let lastPersistedValue: T = preloadValue;

  return createWriteThroughAtom<T>(
    preloadValue,
    nextValue =>
      persistThroughQueue(key, async () => {
        const persisted = await storage.getItem();
        const merged = reconcile({
          persisted,
          previous: lastPersistedValue,
          next: nextValue,
        });
        await storage.setItem(merged);
        lastPersistedValue = nextValue;
      }),
    `atomWithReconciledLocalForage(${key})`,
  );
}
