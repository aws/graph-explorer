import { createStore } from "jotai";
import localforage from "localforage";

import type { SavedConnection } from "@/connections";
import type { AppStore } from "@/core";
import type { PersistenceStatusStore } from "@/core/StateProvider/persistence/persistenceStatusStore";

import { persistenceStatusStore } from "@/core/StateProvider/persistence";
import {
  activeConnectionIdAtom,
  loadPersistedState,
  savedConnectionsAtom,
} from "@/core/StateProvider/storageAtoms";

interface PreloadedConnectionAtoms {
  store: AppStore;
  savedConnectionsAtom: typeof savedConnectionsAtom;
  activeConnectionIdAtom: typeof activeConnectionIdAtom;
  persistenceStatusStore: PersistenceStatusStore;
}

/**
 * Loads the real storage atoms over whatever IndexedDB and sessionStorage
 * currently hold, as the app does on load, and returns a fresh store to read
 * them through.
 */
export async function loadStorageAtoms(): Promise<PreloadedConnectionAtoms> {
  await loadPersistedState();
  return {
    store: createStore(),
    savedConnectionsAtom,
    activeConnectionIdAtom,
    persistenceStatusStore,
  };
}

/**
 * Stores `connections` in IndexedDB, as an earlier version would have left
 * them, then loads the real storage atoms via {@link loadStorageAtoms}.
 */
export async function preloadSavedConnections(
  ...connections: SavedConnection[]
): Promise<PreloadedConnectionAtoms> {
  await localforage.setItem(
    "configuration",
    new Map(connections.map(connection => [connection.id, connection])),
  );
  return loadStorageAtoms();
}

/**
 * Thin wrapper over {@link preloadSavedConnections} for the common case
 * of preloading a single saved connection and reading back its transformed
 * shape.
 */
export async function preloadSavedConnection(
  connection: SavedConnection,
): Promise<SavedConnection | undefined> {
  const { store, savedConnectionsAtom } =
    await preloadSavedConnections(connection);
  return store.get(savedConnectionsAtom).get(connection.id);
}
