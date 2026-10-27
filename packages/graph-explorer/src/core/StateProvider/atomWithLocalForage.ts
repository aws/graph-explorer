import localForage from "localforage";

import { persistThroughQueue } from "./persistence";
import {
  createWriteThroughAtom,
  type Hydration,
  type PersistedAtom,
  type PersistedAtomHandle,
} from "./writeThroughAtom";

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
 * Reshapes a value loaded from a previous app version onto the current type.
 * Must be pure and total — it seeds atom initialization and runs on every load,
 * so it must not throw or have side effects. This is a read-time transform, not
 * a migration: it never writes and leaves the stored value untouched. See the
 * read-time-transform-for-persisted-values ADR.
 */
export type ReadTransform<T> = (loaded: T) => T;

export type AtomWithLocalForageOptions<T> = {
  /**
   * Merge applied against live storage before each write. Pass for an atom
   * backing a collection shared across tabs: each persist re-reads live storage
   * and merges this tab's change onto it (see {@link createReconcilingFlush}),
   * so concurrent edits to different entries by other tabs survive. Opt-in
   * because reconciliation is meaningless for scalar atoms and wrong for per-tab
   * atoms; see the per-key diff-merge reconciliation ADR.
   */
  reconcile?: ReconcileWrite<T>;
  /**
   * Reshapes the preloaded value before it becomes the atom's initial value, so
   * data persisted by an older app version is normalized on read. Runs against
   * both the stored value and, when storage is empty, the `initialValue`. See
   * {@link ReadTransform} for the purity contract.
   */
  transform?: ReadTransform<T>;
};

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
 * @param options Optional {@link AtomWithLocalForageOptions}
 * @returns An atom that persists to localForage
 */
export async function atomWithLocalForage<T>(
  key: string,
  initialValue: T,
  options: AtomWithLocalForageOptions<T> = {},
): Promise<PersistedAtom<T>> {
  const handle = createLocalForageAtom(key, initialValue, options);
  await handle.load();
  return handle.atom;
}

function createLocalForageAtom<T>(
  key: string,
  initialValue: T,
  { reconcile, transform }: AtomWithLocalForageOptions<T>,
): PersistedAtomHandle<T> {
  const storage = createLocalForageStorage<T>(key, initialValue);

  function hydrate(loadedValue: T): Hydration<T> {
    const seed = transform ? transform(loadedValue) : loadedValue;
    const flush = reconcile
      ? createReconcilingFlush(storage, reconcile, seed)
      : storage.setItem;
    return {
      seed,
      persist: nextValue => persistThroughQueue(key, () => flush(nextValue)),
    };
  }

  return createWriteThroughAtom<T>({
    key,
    debugLabel: `atomWithLocalForage(${key})`,
    load: async () => hydrate(await storage.getItem()),
    seedDefault: () => hydrate(initialValue),
  });
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
