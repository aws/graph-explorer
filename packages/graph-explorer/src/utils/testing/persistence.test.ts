import { createRandomName } from "@shared/utils/testing";

import type { VertexType } from "@/core/entities/vertex";
import type {
  UserStyling,
  VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { reconcileUserStyling } from "@/core/StateProvider/userPreferences";

import { openPersistenceTab, readPersistedValue } from "./persistence";
import { createRandomVertexType } from "./randomData";

describe("persistence test helpers", () => {
  test("a tab reads back the value it persisted", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    tab.write("updated");

    expect(tab.read()).toBe("updated");
  });

  test("flush waits for the value to land in storage", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    tab.write("updated");
    await tab.flush();

    expect(await readPersistedValue(key)).toBe("updated");
  });

  test("flush waits for rapid successive writes to settle", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    // Fire several writes without awaiting each, then flush once. The queue
    // coalesces them, so only the latest value lands.
    tab.write("first");
    tab.write("second");
    tab.write("third");
    await tab.flush();

    expect(await readPersistedValue(key)).toBe("third");
  });

  test("a tab opened later preloads what an earlier tab persisted", async () => {
    const key = createRandomName("key");
    const firstTab = await openPersistenceTab(key, "initial");
    firstTab.write("from-first-tab");
    await firstTab.flush();

    const secondTab = await openPersistenceTab(key, "initial");

    expect(secondTab.read()).toBe("from-first-tab");
  });

  test("two tabs over the same key share one storage backend", async () => {
    const key = createRandomName("key");
    const tabA = await openPersistenceTab(key, "initial");
    const tabB = await openPersistenceTab(key, "initial");

    tabA.write("written-by-a");
    await tabA.flush();

    // Tab B holds its own stale in-memory copy until it reloads, but the shared
    // storage already reflects Tab A's write.
    expect(tabB.read()).toBe("initial");
    expect(await readPersistedValue(key)).toBe("written-by-a");
  });

  test("readPersistedValue returns null when nothing was persisted", async () => {
    const key = createRandomName("key");

    expect(await readPersistedValue(key)).toBeNull();
  });
});

/**
 * Guards the per-test IndexedDB reset in `setupTests.ts`. These two tests share
 * a FIXED key on purpose: random keys would pass even if isolation were broken,
 * because each test would read a key the previous one never wrote. The fixed
 * key forces the second test to observe whether the first test's persisted
 * write actually bled through.
 */
describe("per-test storage isolation", () => {
  const sharedKey = "shared-isolation-key";

  test("first test persists a value under the shared key", async () => {
    const tab = await openPersistenceTab(sharedKey, "initial");
    tab.write("written-by-first-test");
    await tab.flush();

    expect(await readPersistedValue(sharedKey)).toBe("written-by-first-test");
  });

  test("second test does not see the first test's persisted value", async () => {
    expect(await readPersistedValue(sharedKey)).toBeNull();
  });
});

/**
 * REGRESSION — #1820 cross-tab styling clobber, fixed by #1831
 *
 * Two tabs share one IndexedDB but each keeps its own in-memory copy of the
 * user styling collection. Without reconciliation, the whole collection is
 * written back on every change, so a tab with a stale in-memory copy silently
 * drops entries another tab added.
 *
 * Scenario from the issue: Tab A styles vertex type X and persists it. Tab B —
 * opened before that write and never having seen X — styles type Y and persists
 * its stale collection. With per-type diff-merge reconciliation wired into the
 * user styling atom, both types survive instead of X being clobbered.
 */
describe("cross-tab user styling reconciliation", () => {
  test("preserves styling written concurrently by two tabs", async () => {
    const key = createRandomName("user-styling");
    const typeX = createRandomVertexType();
    const typeY = createRandomVertexType();

    const styleForType = (type: VertexType): VertexPreferencesStorageModel => ({
      type,
      color: "#ff0000",
    });

    // Both tabs open against empty styling, using the same reconciler the real
    // user styling atom is wired with.
    const tabA = await openPersistenceTab<UserStyling>(
      key,
      {},
      reconcileUserStyling,
    );
    const tabB = await openPersistenceTab<UserStyling>(
      key,
      {},
      reconcileUserStyling,
    );

    // Tab A styles type X and persists.
    tabA.write({ vertices: [styleForType(typeX)] });
    await tabA.flush();

    // Tab B, still holding its stale empty copy, styles type Y and persists.
    tabB.write(prev => ({
      vertices: [...(prev.vertices ?? []), styleForType(typeY)],
    }));
    await tabB.flush();

    const persisted = await readPersistedValue<UserStyling>(key);
    const persistedTypes = new Set(
      persisted?.vertices?.map(vertex => vertex.type),
    );

    expect(persistedTypes).toEqual(new Set([typeX, typeY]));
  });

  test("coalesces rapid writes while still merging onto a concurrent sibling", async () => {
    const key = createRandomName("user-styling");
    const siblingType = createRandomVertexType();
    const typeX = createRandomVertexType();
    const typeY = createRandomVertexType();
    const typeZ = createRandomVertexType();

    const styleForType = (type: VertexType): VertexPreferencesStorageModel => ({
      type,
      color: "#ff0000",
    });

    // A sibling tab persists its type first, so it is already in storage when
    // this tab — which opened stale against empty styling — writes.
    const siblingTab = await openPersistenceTab<UserStyling>(
      key,
      {},
      reconcileUserStyling,
    );
    const editingTab = await openPersistenceTab<UserStyling>(
      key,
      {},
      reconcileUserStyling,
    );

    siblingTab.write({ vertices: [styleForType(siblingType)] });
    await siblingTab.flush();

    // Three rapid writes without awaiting between them. The write queue
    // coalesces the pending flushes to the latest, dropping the intermediate
    // one, so the diff baseline must still advance only on a landed write for
    // the net per-type result to be correct.
    editingTab.write({ vertices: [styleForType(typeX)] });
    editingTab.write(prev => ({
      vertices: [...(prev.vertices ?? []), styleForType(typeY)],
    }));
    editingTab.write(prev => ({
      vertices: [...(prev.vertices ?? []), styleForType(typeZ)],
    }));
    await editingTab.flush();

    const persisted = await readPersistedValue<UserStyling>(key);
    const persistedTypes = new Set(
      persisted?.vertices?.map(vertex => vertex.type),
    );

    expect(persistedTypes).toEqual(new Set([siblingType, typeX, typeY, typeZ]));
  });
});
