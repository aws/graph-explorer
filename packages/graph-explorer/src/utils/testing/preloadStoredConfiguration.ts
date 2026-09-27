import { createStore } from "jotai";
import localforage from "localforage";
import { vi } from "vitest";

import type { RawConfiguration } from "@/core";

/**
 * Stores `config` in IndexedDB, as an earlier version would have left it,
 * then reads it back through a fresh copy of the real `configurationAtom`, as
 * the app does on load. Resets the module registry to get that fresh copy.
 */
export async function preloadStoredConfiguration(
  config: RawConfiguration,
): Promise<RawConfiguration | undefined> {
  vi.resetModules();
  await localforage.setItem("configuration", new Map([[config.id, config]]));
  const { configurationAtom } =
    await import("@/core/StateProvider/storageAtoms");
  return createStore().get(configurationAtom).get(config.id);
}
