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

/** Persists a single value to localForage under one key. */
type LocalForageStorage<T> = ReturnType<typeof createLocalForageStorage<T>>;

/**
 * Merges this tab's change (`next`, against its last-persisted `previous`
 * baseline) onto the freshly-read stored value (`persisted`). See the
 * `reconcile` parameter of {@link atomWithLocalForage} for how and why this is
 * applied.
 */
export type ReconcileWrite<T> = (args: {
  persisted: T;
  previous: T;
  next: T;
}) => T;

/**
 * Builds the flush a reconciling atom hands to the write queue: re-read the
 * live stored value, merge this tab's change onto it via `reconcile`, then
 * persist the result, so a tab with a stale in-memory copy cannot clobber an
 * entry another tab wrote.
 *
 * The merge baseline (`previous`) is the value this tab last persisted; it
 * advances only once a write lands. The per-key write queue this flush runs
 * inside coalesces rapid writes — the dropped intermediate thunks never
 * execute, so the baseline correctly skips them and stays in sync with what
 * was actually written.
 */
function createReconcilingFlush<T>(
  storage: LocalForageStorage<T>,
  reconcile: ReconcileWrite<T>,
  preloadValue: T,
) {
  let lastPersistedValue = preloadValue;

  return async (nextValue: T) => {
    const merged = reconcile({
      persisted: await storage.getItem(),
      previous: lastPersistedValue,
      next: nextValue,
    });
    await storage.setItem(merged);
    lastPersistedValue = nextValue;
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
 * By default each write blindly overwrites the whole stored value. Pass
 * `reconcile` for an atom backing a collection shared across tabs: each persist
 * then re-reads live storage and merges this tab's change onto it (see
 * {@link createReconcilingFlush}), so concurrent edits to different entries by
 * other tabs survive. This is opt-in because reconciliation is meaningless for
 * scalar atoms and wrong for per-tab atoms; see the per-key diff-merge
 * reconciliation ADR.
 *
 * @param key The key to use for the stored value in localForage
 * @param initialValue The initial value if none is found in storage
 * @param reconcile Optional merge applied against live storage before each write
 * @returns An atom that persists to localForage
 */
export async function atomWithLocalForage<T>(
  key: string,
  initialValue: T,
  reconcile?: ReconcileWrite<T>,
) {
  const storage = createLocalForageStorage<T>(key, initialValue);
  const preloadValue = await storage.getItem();

  const flush = reconcile
    ? createReconcilingFlush(storage, reconcile, preloadValue)
    : storage.setItem;

  return createWriteThroughAtom<T>(
    preloadValue,
    nextValue => persistThroughQueue(key, () => flush(nextValue)),
    `atomWithLocalForage(${key})`,
  );
}

/**
 * The reconciler for any atom whose stored value is a `Map` keyed by the merge
 * unit — one entry per connection, per id, etc. Applies this tab's net per-key
 * changes onto the freshly-read map: keys this tab added or changed are
 * upserted, keys it removed are dropped, and every other key another tab wrote
 * is left untouched.
 *
 * Whether a key changed is decided by reference (`Object.is`), since these
 * atoms replace a whole entry on every write (e.g. `new Map(prev).set(id, …)`)
 * rather than mutating it in place — so an unchanged entry keeps its identity
 * and a changed one is a fresh object. No deep compare is needed, unlike the
 * per-`type` styling merge whose array entries are rebuilt structurally.
 */
export function reconcileMapByKey<K, V>({
  persisted,
  previous,
  next,
}: {
  persisted: Map<K, V>;
  previous: Map<K, V>;
  next: Map<K, V>;
}): Map<K, V> {
  const merged = new Map(persisted);

  // Upsert keys this tab added or changed.
  for (const [key, value] of next) {
    if (!Object.is(previous.get(key), value)) {
      merged.set(key, value);
    }
  }

  // Drop keys this tab removed.
  for (const key of previous.keys()) {
    if (!next.has(key)) {
      merged.delete(key);
    }
  }

  return merged;
}
