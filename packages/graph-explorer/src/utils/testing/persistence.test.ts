import { createRandomName } from "@shared/utils/testing";

import type { VertexType } from "@/core/entities/vertex";
import type {
  UserStyling,
  VertexPreferencesStorageModel,
} from "@/core/StateProvider/userPreferences";

import { openPersistenceTab, readPersistedValue } from "./persistence";
import { createRandomVertexType } from "./randomData";

describe("persistence test helpers", () => {
  test("a tab reads back the value it persisted", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    await tab.write("updated");

    expect(tab.read()).toBe("updated");
  });

  test("flush waits for the value to land in storage", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    tab.write("updated");
    await tab.flush();

    expect(await readPersistedValue(key)).toBe("updated");
  });

  test("flush waits for every write, not just the most recent", async () => {
    const key = createRandomName("key");
    const tab = await openPersistenceTab(key, "initial");

    // Fire several writes without awaiting each, then flush once. flush() must
    // wait for all of them; tracking only the latest would let earlier writes
    // be unobserved.
    tab.write("first");
    tab.write("second");
    tab.write("third");
    await tab.flush();

    expect(await readPersistedValue(key)).toBe("third");
  });

  test("a tab opened later preloads what an earlier tab persisted", async () => {
    const key = createRandomName("key");
    const firstTab = await openPersistenceTab(key, "initial");
    await firstTab.write("from-first-tab");

    const secondTab = await openPersistenceTab(key, "initial");

    expect(secondTab.read()).toBe("from-first-tab");
  });

  test("two tabs over the same key share one storage backend", async () => {
    const key = createRandomName("key");
    const tabA = await openPersistenceTab(key, "initial");
    const tabB = await openPersistenceTab(key, "initial");

    await tabA.write("written-by-a");

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
    await tab.write("written-by-first-test");

    expect(await readPersistedValue(sharedKey)).toBe("written-by-first-test");
  });

  test("second test does not see the first test's persisted value", async () => {
    expect(await readPersistedValue(sharedKey)).toBeNull();
  });
});

/**
 * REGRESSION — #1820 cross-tab styling clobber
 *
 * Two tabs share one IndexedDB but each keeps its own in-memory copy of the
 * user styling collection. `atomWithLocalForage` writes the whole collection
 * back on every change, so a tab with a stale in-memory copy silently drops
 * entries another tab added.
 *
 * Scenario from the issue: Tab A styles vertex type X and persists it. Tab B —
 * opened before that write and never having seen X — styles type Y and persists
 * its stale collection, clobbering X.
 *
 * Two assertions encode this:
 *
 * 1. A normal, currently-passing test that pins the CLOBBER as it behaves today
 *    — type X is dropped, only type Y survives. This is the deterministic guard:
 *    if the scenario ever stops reproducing (setup breaks, the bug changes
 *    shape), this test fails loudly instead of silently passing.
 * 2. A `test.fails` describing the DESIRED behaviour — both types survive. It
 *    turns green when reconciliation (#1831) lands, signalling that the fix
 *    works and this whole block should be collapsed into a single passing test.
 *
 * The fixture runs in `beforeAll`, OUTSIDE both tests. `test.fails` passes on
 * any throw, so building the fixture inside it would let a setup failure keep
 * the test green for the wrong reason. Keeping setup out means only the final
 * assertion can satisfy (or break) the expectation.
 *
 * TODO #1820 / #1831: collapse into one passing test once reconciliation lands.
 */
describe("cross-tab user styling reconciliation", () => {
  let persistedTypes: Set<string>;
  let typeX: VertexType;
  let typeY: VertexType;

  beforeAll(async () => {
    const key = createRandomName("user-styling");
    typeX = createRandomVertexType();
    typeY = createRandomVertexType();

    const styleForType = (type: VertexType): VertexPreferencesStorageModel => ({
      type,
      color: "#ff0000",
    });

    // Both tabs open against empty styling.
    const tabA = await openPersistenceTab<UserStyling>(key, {});
    const tabB = await openPersistenceTab<UserStyling>(key, {});

    // Tab A styles type X and persists.
    await tabA.write({ vertices: [styleForType(typeX)] });

    // Tab B, still holding its stale empty copy, styles type Y and persists.
    await tabB.write(prev => ({
      vertices: [...(prev.vertices ?? []), styleForType(typeY)],
    }));

    const persisted = await readPersistedValue<UserStyling>(key);
    persistedTypes = new Set(persisted?.vertices?.map(vertex => vertex.type));
  });

  test("clobbers type X today — only the stale tab's type Y survives", () => {
    expect(persistedTypes).toEqual(new Set([typeY]));
  });

  test.fails("should preserve styling from both tabs (fixed by #1831)", () => {
    expect(persistedTypes).toEqual(new Set([typeX, typeY]));
  });
});
