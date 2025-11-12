import { getDefaultStore } from "jotai";

/**
 * Gets the store used for all app state.
 *
 * This represents the Jotai store. By default it uses getDefaultStore() from
 * Jotai. For tests it is mocked out automatically for just a standard
 * createStore().
 * @returns a Jotai store
 */
export function getAppStore() {
  return getDefaultStore();
}

export type AppStore = ReturnType<typeof getAppStore>;
