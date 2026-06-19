import { createStore } from "jotai";
import localForage from "localforage";
import { beforeEach, describe, expect, test } from "vitest";

import { createNewConfigurationId } from "@/core";
import { readPersistedValue } from "@/utils/testing";

import {
  ACTIVE_CONNECTION_STORAGE_KEY,
  createActiveConfigurationAtom,
} from "./activeConnectionStorage";
import { createInMemorySessionStorage } from "./safeSessionStorage";

/**
 * Simulates one browser tab exploring the active connection. Each tab has its
 * own Jotai store and its own sessionStorage (per-tab state), while all tabs
 * share the one fake-indexeddb the test provisions — exactly how same-origin
 * tabs relate. Opening a tab preloads the breadcrumb, like app startup does.
 */
async function openTab() {
  // sessionStorage is per-tab and survives a reload, so it persists across the
  // store/atom rebuild that reload() models.
  const sessionStorage = createInMemorySessionStorage();
  let store = createStore();
  let atom = await createActiveConfigurationAtom({ sessionStorage });
  return {
    read: () => store.get(atom),
    /** Activates a connection; resolves once the breadcrumb has landed. */
    activate: (id: ReturnType<typeof createNewConfigurationId> | null) =>
      store.set(atom, id),
    /** Reloads this tab: a fresh store and atom over the same sessionStorage. */
    reload: async () => {
      store = createStore();
      atom = await createActiveConfigurationAtom({ sessionStorage });
    },
  };
}

describe("activeConnectionStorage", () => {
  beforeEach(async () => {
    await localForage.clear();
  });

  test("cold start seeds the active connection from the persisted breadcrumb", async () => {
    const breadcrumb = createNewConfigurationId();
    await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, breadcrumb);
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createActiveConfigurationAtom({ sessionStorage });

    const store = createStore();
    expect(store.get(atom)).toBe(breadcrumb);
  });

  test("treats an empty sessionStorage value as a miss and falls back to the breadcrumb", async () => {
    const breadcrumb = createNewConfigurationId();
    await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, breadcrumb);
    const sessionStorage = createInMemorySessionStorage();
    sessionStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, "");

    const atom = await createActiveConfigurationAtom({ sessionStorage });

    const store = createStore();
    expect(store.get(atom)).toBe(breadcrumb);
  });

  test("warm reload keeps this tab's sessionStorage value over the breadcrumb", async () => {
    const breadcrumb = createNewConfigurationId();
    const tabValue = createNewConfigurationId();
    await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, breadcrumb);
    const sessionStorage = createInMemorySessionStorage();
    sessionStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, tabValue);

    const atom = await createActiveConfigurationAtom({ sessionStorage });

    const store = createStore();
    expect(store.get(atom)).toBe(tabValue);
  });

  test("activating a connection writes both this tab and the breadcrumb", async () => {
    const sessionStorage = createInMemorySessionStorage();
    const atom = await createActiveConfigurationAtom({ sessionStorage });
    const store = createStore();

    const activated = createNewConfigurationId();
    // The in-memory value and sessionStorage update synchronously; the write
    // returns the breadcrumb persistence promise to await without timeouts.
    const persisted = store.set(atom, activated);

    expect(store.get(atom)).toBe(activated);
    expect(sessionStorage.getItem(ACTIVE_CONNECTION_STORAGE_KEY)).toBe(
      activated,
    );
    await persisted;
    expect(await localForage.getItem(ACTIVE_CONNECTION_STORAGE_KEY)).toBe(
      activated,
    );
  });

  test("clearing the active connection clears this tab but is reflected in the breadcrumb", async () => {
    const previous = createNewConfigurationId();
    await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, previous);
    const sessionStorage = createInMemorySessionStorage();
    sessionStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, previous);

    const atom = await createActiveConfigurationAtom({ sessionStorage });
    const store = createStore();
    const persisted = store.set(atom, null);

    expect(store.get(atom)).toBeNull();
    expect(sessionStorage.getItem(ACTIVE_CONNECTION_STORAGE_KEY)).toBeNull();
    await persisted;
    expect(await localForage.getItem(ACTIVE_CONNECTION_STORAGE_KEY)).toBeNull();
  });

  // No sessionStorage argument exercises the built-in fallback used when no DOM
  // storage is available (non-DOM contexts, or storage blocked/throwing). It
  // must still seed from the breadcrumb and round-trip writes in memory.
  test("falls back to in-memory storage when no sessionStorage is available", async () => {
    const breadcrumb = createNewConfigurationId();
    await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, breadcrumb);

    const atom = await createActiveConfigurationAtom();
    const store = createStore();
    expect(store.get(atom)).toBe(breadcrumb);

    const activated = createNewConfigurationId();
    store.set(atom, activated);
    expect(store.get(atom)).toBe(activated);
  });
});

// These exercise the cross-tab behavior end-to-end over one shared
// fake-indexeddb backend: each tab has its own store and sessionStorage, so the
// only thing they share is the persisted breadcrumb — exactly like same-origin
// browser tabs.
describe("activeConnectionStorage across tabs", () => {
  beforeEach(async () => {
    await localForage.clear();
  });

  test("activating a connection in one tab does not change an already-open tab", async () => {
    const tabB = await openTab();
    const tabBConnection = createNewConfigurationId();
    await tabB.activate(tabBConnection);

    const tabA = await openTab();
    await tabA.activate(createNewConfigurationId());

    expect(tabB.read()).toBe(tabBConnection);
  });

  test("a tab opened later cold-starts to the connection an earlier tab activated", async () => {
    const earlierTab = await openTab();
    const connection = createNewConfigurationId();
    await earlierTab.activate(connection);

    const freshTab = await openTab();

    expect(freshTab.read()).toBe(connection);
  });

  test("a cold-started tab keeps its connection across reload when another tab changes the breadcrumb", async () => {
    // Tab A cold-starts on X (seeded from the breadcrumb), without ever
    // explicitly activating it.
    const connectionX = createNewConfigurationId();
    await localForage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, connectionX);
    const tabA = await openTab();
    expect(tabA.read()).toBe(connectionX);

    // Another tab switches to Y, moving the shared breadcrumb.
    const tabB = await openTab();
    const connectionY = createNewConfigurationId();
    await tabB.activate(connectionY);

    // Tab A reloads. Its connection must remain X, not adopt the breadcrumb's Y.
    await tabA.reload();
    expect(tabA.read()).toBe(connectionX);
  });

  test("the breadcrumb is last-writer-wins across tabs", async () => {
    const tabA = await openTab();
    const tabB = await openTab();

    const connectionA = createNewConfigurationId();
    const connectionB = createNewConfigurationId();
    await tabA.activate(connectionA);
    await tabB.activate(connectionB);

    expect(await readPersistedValue(ACTIVE_CONNECTION_STORAGE_KEY)).toBe(
      connectionB,
    );

    const freshTab = await openTab();
    expect(freshTab.read()).toBe(connectionB);
  });
});
