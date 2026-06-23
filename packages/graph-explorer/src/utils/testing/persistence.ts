import { createStore } from "jotai";
import localforage from "localforage";

import type { AppStore } from "@/core";
import type { ReconcileWrite } from "@/core/StateProvider/atomWithLocalForage";

import {
  atomWithLocalForage,
  atomWithReconciledLocalForage,
} from "@/core/StateProvider/atomWithLocalForage";
import { persistenceStatusStore } from "@/core/StateProvider/persistence";

type SetStateAction<Value> = Value | ((prev: Value) => Value);

/**
 * Simulates a single browser tab persisting one localForage-backed value.
 *
 * Each tab has its own Jotai store and its own `atomWithLocalForage` instance,
 * so its in-memory cache is independent of every other tab. All tabs created
 * for the same key share the one fake-indexeddb database that `setupTests.ts`
 * provisions per test, which is exactly how same-origin browser tabs relate:
 * separate memory, shared IndexedDB.
 *
 * Use {@link openPersistenceTab} to create a tab; it preloads the persisted
 * value just like the real app does at startup.
 */
export class PersistenceTab<T> {
  #store: AppStore;
  #atom: Awaited<ReturnType<typeof atomWithLocalForage<T>>>;

  constructor(
    store: AppStore,
    atom: Awaited<ReturnType<typeof atomWithLocalForage<T>>>,
  ) {
    this.#store = store;
    this.#atom = atom;
  }

  /** Reads this tab's in-memory value. */
  read(): T {
    return this.#store.get(this.#atom);
  }

  /**
   * Writes a new value to this tab. The in-memory value updates synchronously;
   * persistence happens in the background through the shared write queue.
   */
  write(update: SetStateAction<T>): void {
    this.#store.set(this.#atom, update);
  }

  /**
   * Waits for all outstanding background writes to land in storage, letting
   * tests assert against persisted state without arbitrary timeouts.
   */
  flush(): Promise<void> {
    return persistenceStatusStore.waitForIdle();
  }
}

/**
 * Opens a new {@link PersistenceTab} for the given key, preloading whatever is
 * currently persisted (or the initial value when storage is empty), mirroring
 * how the app loads a localForage atom at startup.
 *
 * Pass the same `reconcile` the real atom is wired with to exercise cross-tab
 * reconciliation; omit it to model a plain whole-value-overwrite atom.
 */
export async function openPersistenceTab<T>(
  key: string,
  initialValue: T,
  reconcile?: ReconcileWrite<T>,
): Promise<PersistenceTab<T>> {
  const store = createStore();
  const atom = reconcile
    ? await atomWithReconciledLocalForage<T>(key, initialValue, reconcile)
    : await atomWithLocalForage<T>(key, initialValue);
  return new PersistenceTab(store, atom);
}

/**
 * Reads what actually landed in persisted storage for the given key, bypassing
 * any tab's in-memory cache. Use this to assert against the durable state
 * rather than what a tab happens to hold in memory.
 */
export function readPersistedValue<T>(key: string): Promise<T | null> {
  return localforage.getItem<T>(key);
}
