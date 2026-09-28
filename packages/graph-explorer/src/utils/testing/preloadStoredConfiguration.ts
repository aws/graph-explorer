import { createStore } from "jotai";
import localforage from "localforage";
import { vi } from "vitest";

import type { AppStore, RawConfiguration } from "@/core";
import type { PersistenceStatusStore } from "@/core/StateProvider/persistence/persistenceStatusStore";
import type { configurationAtom } from "@/core/StateProvider/storageAtoms";

interface PreloadedConfigurationAtoms {
  store: AppStore;
  configurationAtom: typeof configurationAtom;
  persistenceStatusStore: PersistenceStatusStore;
}

/**
 * Stores `configs` in IndexedDB, as an earlier version would have left them,
 * then loads a fresh copy of the real `configurationAtom`, as the app does on
 * load. Resets the module registry to get that fresh copy, and returns a
 * matching store and persistence status store since both are only valid
 * alongside that same fresh copy.
 */
export async function preloadStoredConfigurations(
  ...configs: RawConfiguration[]
): Promise<PreloadedConfigurationAtoms> {
  vi.resetModules();
  await localforage.setItem(
    "configuration",
    new Map(configs.map(config => [config.id, config])),
  );
  const [{ configurationAtom }, { persistenceStatusStore }] = await Promise.all(
    [
      import("@/core/StateProvider/storageAtoms"),
      import("@/core/StateProvider/persistence"),
    ],
  );
  return { store: createStore(), configurationAtom, persistenceStatusStore };
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
