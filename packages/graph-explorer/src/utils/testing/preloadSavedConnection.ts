import { createStore } from "jotai";
import localforage from "localforage";
import { vi } from "vitest";

import type { SavedConnection } from "@/connections";
import type { AppStore } from "@/core";
import type { PersistenceStatusStore } from "@/core/StateProvider/persistence/persistenceStatusStore";
import type {
  activeConnectionIdAtom,
  savedConnectionsAtom,
} from "@/core/StateProvider/storageAtoms";

interface PreloadedConnectionAtoms {
  store: AppStore;
  savedConnectionsAtom: typeof savedConnectionsAtom;
  activeConnectionIdAtom: typeof activeConnectionIdAtom;
  persistenceStatusStore: PersistenceStatusStore;
}

/**
 * Loads a fresh copy of the real storage atoms over whatever IndexedDB and
 * sessionStorage currently hold, as the app does on load. Resets the module
 * registry to get that fresh copy, and returns a matching store and
 * persistence status store since both are only valid alongside that same
 * fresh copy.
 */
export async function loadStorageAtoms(): Promise<PreloadedConnectionAtoms> {
  vi.resetModules();
  const [
    { savedConnectionsAtom, activeConnectionIdAtom },
    { persistenceStatusStore },
  ] = await Promise.all([
    import("@/core/StateProvider/storageAtoms"),
    import("@/core/StateProvider/persistence"),
  ]);
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
