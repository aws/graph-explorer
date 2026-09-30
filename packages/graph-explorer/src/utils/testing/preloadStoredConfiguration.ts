import { createStore } from "jotai";
import localforage from "localforage";
import { vi } from "vitest";

import type { RawConfiguration } from "@/connections";
import type { AppStore } from "@/core";
import type { PersistenceStatusStore } from "@/core/StateProvider/persistence/persistenceStatusStore";
import type {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/storageAtoms";

interface PreloadedConfigurationAtoms {
  store: AppStore;
  configurationAtom: typeof configurationAtom;
  activeConfigurationAtom: typeof activeConfigurationAtom;
  persistenceStatusStore: PersistenceStatusStore;
}

/**
 * Loads a fresh copy of the real storage atoms over whatever IndexedDB and
 * sessionStorage currently hold, as the app does on load. Resets the module
 * registry to get that fresh copy, and returns a matching store and
 * persistence status store since both are only valid alongside that same
 * fresh copy.
 */
export async function loadStorageAtoms(): Promise<PreloadedConfigurationAtoms> {
  vi.resetModules();
  const [
    { configurationAtom, activeConfigurationAtom },
    { persistenceStatusStore },
  ] = await Promise.all([
    import("@/core/StateProvider/storageAtoms"),
    import("@/core/StateProvider/persistence"),
  ]);
  return {
    store: createStore(),
    configurationAtom,
    activeConfigurationAtom,
    persistenceStatusStore,
  };
}

/**
 * Stores `configs` in IndexedDB, as an earlier version would have left them,
 * then loads the real storage atoms via {@link loadStorageAtoms}.
 */
export async function preloadStoredConfigurations(
  ...configs: RawConfiguration[]
): Promise<PreloadedConfigurationAtoms> {
  await localforage.setItem(
    "configuration",
    new Map(configs.map(config => [config.id, config])),
  );
  return loadStorageAtoms();
}

/**
 * Thin wrapper over {@link preloadStoredConfigurations} for the common case
 * of preloading a single stored configuration and reading back its
 * transformed shape.
 */
export async function preloadStoredConfiguration(
  config: RawConfiguration,
): Promise<RawConfiguration | undefined> {
  const { store, configurationAtom } =
    await preloadStoredConfigurations(config);
  return store.get(configurationAtom).get(config.id);
}
