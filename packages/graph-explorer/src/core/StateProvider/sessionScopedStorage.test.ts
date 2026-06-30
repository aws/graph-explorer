import { createStore } from "jotai";
import localForage from "localforage";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { logger } from "@/utils";

import {
  defaultGraphViewLayout,
  type GraphViewLayout,
  graphViewLayoutCodec,
} from "./graphViewLayoutDefaults";
import { persistenceStatusStore } from "./persistence";
import { createInMemorySessionStorage } from "./safeSessionStorage";
import {
  createSessionScopedAtom,
  parseSessionJson,
  type SessionValueCodec,
} from "./sessionScopedStorage";

type Counter = { count: number };

const counterSchema = z.object({ count: z.number() });

/**
 * A JSON codec that round-trips a small object and rejects anything that does
 * not match the schema, so the corrupt-value fallthrough can be exercised.
 */
const counterCodec: SessionValueCodec<Counter> = {
  serialize: value => JSON.stringify(value),
  deserialize: raw => parseSessionJson(raw, counterSchema),
};

const KEY = "test-counter";

/**
 * Simulates one browser tab over the counter atom: its own Jotai store and
 * sessionStorage (per-tab), all tabs sharing the one fake-indexeddb. Mirrors
 * the active-connection test harness.
 */
async function openTab() {
  const sessionStorage = createInMemorySessionStorage();
  let store = createStore();
  let atom = await createSessionScopedAtom<Counter>({
    key: KEY,
    defaultValue: { count: 0 },
    codec: counterCodec,
    sessionStorage,
  });
  return {
    read: () => store.get(atom),
    write: (value: Counter) => {
      store.set(atom, value);
      return persistenceStatusStore.waitForIdle();
    },
    session: () => sessionStorage.getItem(KEY),
    reload: async () => {
      store = createStore();
      atom = await createSessionScopedAtom<Counter>({
        key: KEY,
        defaultValue: { count: 0 },
        codec: counterCodec,
        sessionStorage,
      });
    },
  };
}

describe("createSessionScopedAtom", () => {
  beforeEach(async () => {
    await localForage.clear();
  });

  test("cold start seeds from the persisted breadcrumb and claims it into this tab", async () => {
    await localForage.setItem<Counter>(KEY, { count: 7 });
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 7 });
    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify({ count: 7 }));
  });

  test("falls back to the default value when neither session nor breadcrumb is present", async () => {
    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage: createInMemorySessionStorage(),
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 0 });
  });

  test("warm reload keeps this tab's session value over the breadcrumb", async () => {
    await localForage.setItem<Counter>(KEY, { count: 7 });
    const sessionStorage = createInMemorySessionStorage();
    sessionStorage.setItem(KEY, JSON.stringify({ count: 42 }));

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 42 });
  });

  test("discards a corrupt session value with a warning and falls back to the breadcrumb", async () => {
    await localForage.setItem<Counter>(KEY, { count: 7 });
    const sessionStorage = createInMemorySessionStorage();
    sessionStorage.setItem(KEY, "{ not valid json");

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 7 });
    expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
  });

  test("recovers when reading sessionStorage throws, falling back to the breadcrumb", async () => {
    await localForage.setItem<Counter>(KEY, { count: 7 });
    const sessionStorage = createInMemorySessionStorage();
    // DOM storage blocked: accessing the value throws a SecurityError rather
    // than returning null. The seam must treat this as a miss, not crash boot.
    vi.spyOn(sessionStorage, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 7 });
    expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
  });

  test("writing updates this tab synchronously and the breadcrumb in the background", async () => {
    const sessionStorage = createInMemorySessionStorage();
    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });
    const store = createStore();

    store.set(atom, { count: 5 });

    expect(store.get(atom)).toStrictEqual({ count: 5 });
    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify({ count: 5 }));
    await persistenceStatusStore.waitForIdle();
    expect(await localForage.getItem<Counter>(KEY)).toStrictEqual({ count: 5 });
  });

  test("a serialize that returns null removes the per-tab key but still writes the breadcrumb", async () => {
    // A codec that refuses to persist the empty state to the per-tab layer, so
    // a later reload of this tab does not re-seed from it.
    const clearingCodec: SessionValueCodec<Counter> = {
      serialize: value => (value.count === 0 ? null : JSON.stringify(value)),
      deserialize: raw => parseSessionJson(raw, counterSchema),
    };
    const sessionStorage = createInMemorySessionStorage();
    sessionStorage.setItem(KEY, JSON.stringify({ count: 5 }));

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: clearingCodec,
      sessionStorage,
    });
    const store = createStore();
    store.set(atom, { count: 0 });

    expect(sessionStorage.getItem(KEY)).toBeNull();
    await persistenceStatusStore.waitForIdle();
    expect(await localForage.getItem<Counter>(KEY)).toStrictEqual({ count: 0 });
  });
});

describe("createSessionScopedAtom across tabs", () => {
  beforeEach(async () => {
    await localForage.clear();
  });

  test("writing in one tab does not change an already-open tab", async () => {
    const tabB = await openTab();
    await tabB.write({ count: 2 });

    const tabA = await openTab();
    await tabA.write({ count: 99 });

    expect(tabB.read()).toStrictEqual({ count: 2 });
  });

  test("a tab opened later cold-starts to the value an earlier tab wrote", async () => {
    const earlierTab = await openTab();
    await earlierTab.write({ count: 3 });

    const freshTab = await openTab();

    expect(freshTab.read()).toStrictEqual({ count: 3 });
  });

  test("a cold-started tab keeps its value across reload when another tab moves the breadcrumb", async () => {
    await localForage.setItem<Counter>(KEY, { count: 1 });
    const tabA = await openTab();
    expect(tabA.read()).toStrictEqual({ count: 1 });

    const tabB = await openTab();
    await tabB.write({ count: 2 });

    await tabA.reload();
    expect(tabA.read()).toStrictEqual({ count: 1 });
  });
});

// The breadcrumb keeps the native value (structured clone preserves the
// activeToggles Set), but the per-tab sessionStorage claim must go through the
// codec, which serializes that Set as an array. This exercises the helper and
// graphViewLayoutCodec together over that exact path — the reason the branch
// exists — rather than each in isolation.
describe("createSessionScopedAtom with the graph view layout codec", () => {
  const LAYOUT_KEY = "graph-view-layout";

  beforeEach(async () => {
    await localForage.clear();
  });

  test("cold start claims a Set-bearing breadcrumb into sessionStorage as its array form", async () => {
    const breadcrumb: GraphViewLayout = {
      activeSidebarItem: "filters",
      activeToggles: new Set(["graph-viewer", "table-view"]),
      sidebar: { width: 321 },
      tableView: { height: 250 },
      detailsAutoOpenOnSelection: false,
    };
    await localForage.setItem<GraphViewLayout>(LAYOUT_KEY, breadcrumb);
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createSessionScopedAtom<GraphViewLayout>({
      key: LAYOUT_KEY,
      defaultValue: defaultGraphViewLayout,
      codec: graphViewLayoutCodec,
      sessionStorage,
    });

    const store = createStore();
    const seeded = store.get(atom);
    expect(seeded.activeToggles).toBeInstanceOf(Set);
    expect(seeded).toStrictEqual(breadcrumb);

    // The claimed per-tab value is the array-serialized form, and a warm reload
    // off it rebuilds the Set rather than seeding from the breadcrumb again.
    expect(sessionStorage.getItem(LAYOUT_KEY)).toBe(
      graphViewLayoutCodec.serialize(breadcrumb),
    );
    expect(
      graphViewLayoutCodec.deserialize(sessionStorage.getItem(LAYOUT_KEY)),
    ).toStrictEqual(breadcrumb);
  });
});
