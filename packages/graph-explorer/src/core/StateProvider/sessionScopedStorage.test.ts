import { createStore } from "jotai";
import localForage from "localforage";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { logger } from "@/utils";
import { createRandomGraphViewLayout } from "@/utils/testing";

import {
  DEFAULT_SIDEBAR_WIDTH,
  defaultGraphViewLayout,
  type GraphViewLayout,
  graphViewLayoutCodec,
} from "./graphViewLayoutDefaults";
import { persistenceStatusStore } from "./persistence";
import { createInMemorySessionStorage } from "./safeSessionStorage";
import {
  defaultSchemaViewLayout,
  type SchemaViewLayout,
  schemaViewLayoutCodec,
} from "./schemaViewLayoutDefaults";
import {
  createSessionScopedAtom,
  parseSessionJson,
  type SessionScopedAtomOptions,
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
  parseStored: stored => counterSchema.parse(stored),
};

const KEY = "test-counter";

/**
 * Builds a tab-opener bound to one key/default/codec. Each opened tab has its
 * own Jotai store and sessionStorage (per-tab), while all tabs share the one
 * fake-indexeddb — exactly how same-origin tabs relate. Mirrors the
 * active-connection test harness, parameterized so each real codec can be
 * exercised through the same multi-tab sequences rather than only a toy codec.
 */
function tabOpener<T>(
  options: Omit<SessionScopedAtomOptions<T>, "sessionStorage">,
) {
  return async function openTab() {
    const sessionStorage = createInMemorySessionStorage();
    let store = createStore();
    let atom = await createSessionScopedAtom<T>({ ...options, sessionStorage });
    return {
      read: () => store.get(atom),
      write: (value: T) => {
        store.set(atom, value);
        return persistenceStatusStore.waitForIdle();
      },
      reload: async () => {
        store = createStore();
        atom = await createSessionScopedAtom<T>({ ...options, sessionStorage });
      },
    };
  };
}

const openTab = tabOpener<Counter>({
  key: KEY,
  defaultValue: { count: 0 },
  codec: counterCodec,
});

describe("createSessionScopedAtom", () => {
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

  test("tolerates a failing per-tab write and still persists the breadcrumb", async () => {
    // sessionStorage.setItem can throw QuotaExceededError once storage fills,
    // after resolveSessionStorage already handed back a working store. The throw
    // must not escape the Jotai setter into the React subtree that set the atom.
    const sessionStorage = createInMemorySessionStorage();
    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const store = createStore();

    expect(() => store.set(atom, { count: 5 })).not.toThrow();

    expect(store.get(atom)).toStrictEqual({ count: 5 });
    expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
    await persistenceStatusStore.waitForIdle();
    expect(await localForage.getItem<Counter>(KEY)).toStrictEqual({ count: 5 });
  });

  test("lets a throwing codec escape instead of logging it as a write failure", async () => {
    // A codec that throws is a defect, not a storage condition, so it must not
    // be laundered into the warning that QuotaExceededError gets.
    const brokenCodec: SessionValueCodec<Counter> = {
      ...counterCodec,
      serialize: () => {
        throw new TypeError("activeToggles is not iterable");
      },
    };
    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: brokenCodec,
      sessionStorage: createInMemorySessionStorage(),
    });
    const store = createStore();

    expect(() => store.set(atom, { count: 5 })).toThrow(
      new TypeError("activeToggles is not iterable"),
    );
    expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
  });

  test("a serialize that returns null removes the per-tab key but still writes the breadcrumb", async () => {
    // A codec that refuses to persist the empty state to the per-tab layer, so
    // a later reload of this tab does not re-seed from it.
    const clearingCodec: SessionValueCodec<Counter> = {
      ...counterCodec,
      serialize: value => (value.count === 0 ? null : JSON.stringify(value)),
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

  test("normalizes the breadcrumb through parseStored and claims the normalized value", async () => {
    await localForage.setItem<Counter>(KEY, { count: 7 });
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: {
        ...counterCodec,
        parseStored: stored => ({
          count: counterSchema.parse(stored).count * 10,
        }),
      },
      sessionStorage,
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 70 });
    // The tab claims the normalized value, so a later reload reads it back
    // rather than re-normalizing an old shape every boot.
    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify({ count: 70 }));
  });

  test("parses only the breadcrumb, not this tab's own session value or the default", async () => {
    const parseStored = vi.fn((stored: unknown) => counterSchema.parse(stored));
    const codec = { ...counterCodec, parseStored };
    const warmStorage = createInMemorySessionStorage();
    warmStorage.setItem(KEY, JSON.stringify({ count: 42 }));

    const warmAtom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec,
      sessionStorage: warmStorage,
    });
    const coldAtom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec,
      sessionStorage: createInMemorySessionStorage(),
    });

    const store = createStore();
    expect(store.get(warmAtom)).toStrictEqual({ count: 42 });
    expect(store.get(coldAtom)).toStrictEqual({ count: 0 });
    expect(parseStored).not.toHaveBeenCalled();
  });

  test("discards a corrupt breadcrumb with a warning and falls back to the default", async () => {
    // A hand-edited value, or one a rolled-back app version wrote, must not
    // reject the factory: storageAtoms awaits it at top level, so a throw here
    // would blank the app instead of losing one view preference.
    await localForage.setItem(KEY, { count: "seven" });
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      sessionStorage,
    });

    expect(createStore().get(atom)).toStrictEqual({ count: 0 });
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
  });
});

describe("createSessionScopedAtom across tabs", () => {
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

const GRAPH_VIEW_LAYOUT_KEY = "graph-view-layout";

const openGraphViewTab = tabOpener<GraphViewLayout>({
  key: GRAPH_VIEW_LAYOUT_KEY,
  defaultValue: defaultGraphViewLayout,
  codec: graphViewLayoutCodec,
});

// The breadcrumb keeps the native value (structured clone preserves the
// activeToggles Set), but the per-tab sessionStorage claim must go through the
// codec, which serializes that Set as an array. This exercises the helper and
// graphViewLayoutCodec together over that exact path — the reason the branch
// exists — rather than each in isolation.
describe("createSessionScopedAtom with the graph view layout codec", () => {
  test("cold start claims a Set-bearing breadcrumb into sessionStorage as its array form", async () => {
    const breadcrumb: GraphViewLayout = {
      activeSidebarItem: "filters",
      activeToggles: new Set(["graph-viewer", "table-view"]),
      sidebar: { width: 321 },
      tableView: { height: 250 },
      detailsAutoOpenOnSelection: false,
    };
    await localForage.setItem<GraphViewLayout>(
      GRAPH_VIEW_LAYOUT_KEY,
      breadcrumb,
    );
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createSessionScopedAtom<GraphViewLayout>({
      key: GRAPH_VIEW_LAYOUT_KEY,
      defaultValue: defaultGraphViewLayout,
      codec: graphViewLayoutCodec,
      sessionStorage,
    });

    const store = createStore();
    const seeded = store.get(atom);
    expect(seeded.activeToggles).toBeInstanceOf(Set);
    expect(seeded).toStrictEqual(breadcrumb);

    // The claimed per-tab value is the array-serialized form, pinned literally
    // so a serialize that dropped a field could not satisfy both sides at once.
    expect(
      JSON.parse(sessionStorage.getItem(GRAPH_VIEW_LAYOUT_KEY) ?? "null"),
    ).toStrictEqual({
      activeSidebarItem: "filters",
      activeToggles: ["graph-viewer", "table-view"],
      sidebar: { width: 321 },
      tableView: { height: 250 },
      detailsAutoOpenOnSelection: false,
    });
    // A warm reload off that value rebuilds the Set rather than re-seeding.
    expect(
      graphViewLayoutCodec.deserialize(
        sessionStorage.getItem(GRAPH_VIEW_LAYOUT_KEY),
      ),
    ).toStrictEqual(breadcrumb);
  });

  test("a breadcrumb missing its toggles falls back to the default instead of crashing boot", async () => {
    await localForage.setItem(GRAPH_VIEW_LAYOUT_KEY, {
      activeSidebarItem: "filters",
      sidebar: { width: 400 },
    });

    const tab = await openGraphViewTab();

    expect(tab.read()).toStrictEqual(defaultGraphViewLayout);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
  });
});

/**
 * BACKWARD COMPATIBILITY — PERSISTED DATA
 *
 * The graph view layout breadcrumb keeps the shape older versions wrote to
 * IndexedDB: `activeSidebarItem` may be the retired "nodes-styling" or
 * "edges-styling", and `sidebar` may be unset because older versions only
 * wrote it on the first resize. The breadcrumb is the only path an old shape
 * can arrive by. `parseStored` normalizes both; without that, either the
 * breadcrumb would be discarded as corrupt or the per-tab codec would reject the
 * claimed value on every reload, losing the user's View Layout.
 *
 * DO NOT delete or weaken these tests without confirming that all persisted
 * data has been transformed or that the old values are no longer in the wild.
 */
describe("backward compatibility: graph view layout breadcrumb", () => {
  test("remaps a retired sidebar item on cold start", async () => {
    await localForage.setItem(GRAPH_VIEW_LAYOUT_KEY, {
      ...defaultGraphViewLayout,
      activeSidebarItem: "nodes-styling",
    } as unknown as GraphViewLayout);

    const tab = await openGraphViewTab();

    expect(tab.read().activeSidebarItem).toBe("styles");
  });

  test("a breadcrumb without a sidebar keeps this tab's value across reload", async () => {
    const { sidebar: _, ...withoutSidebar } = createRandomGraphViewLayout();
    await localForage.setItem(GRAPH_VIEW_LAYOUT_KEY, withoutSidebar);
    const tabA = await openGraphViewTab();
    const claimed = tabA.read();
    expect(claimed.sidebar).toStrictEqual({ width: DEFAULT_SIDEBAR_WIDTH });

    const tabB = await openGraphViewTab();
    await tabB.write(createRandomGraphViewLayout());

    await tabA.reload();
    // toEqual, not toStrictEqual: the JSON round-trip drops keys the random
    // breadcrumb holds as undefined.
    expect(tabA.read()).toEqual(claimed);
    expect(vi.mocked(logger.warn)).not.toHaveBeenCalled();
  });
});

// Graph view is the codec with real risk: its activeToggles Set must survive
// the array serialization across a write-in-one-tab / cold-start-in-another
// sequence, which the toy counter codec above cannot reach.
describe("graph view layout across tabs", () => {
  test("a later tab cold-starts to the view layout an earlier tab wrote, with toggles rebuilt as a Set", async () => {
    const earlierTab = await openGraphViewTab();
    const written: GraphViewLayout = {
      ...defaultGraphViewLayout,
      activeSidebarItem: "expand",
      activeToggles: new Set(["table-view"]),
      sidebar: { width: 512 },
    };
    await earlierTab.write(written);

    const freshTab = await openGraphViewTab();

    const seeded = freshTab.read();
    expect(seeded).toStrictEqual(written);
    expect(seeded.activeToggles).toBeInstanceOf(Set);
  });
});

// Schema view's codec is structurally the same as the counter codec above, so
// these only confirm the real codec composes with the per-tab primitive. The
// codec itself is covered in schemaViewLayoutDefaults.test.ts.
describe("schema view layout across tabs", () => {
  const openSchemaViewTab = tabOpener<SchemaViewLayout>({
    key: "schema-view-layout",
    defaultValue: defaultSchemaViewLayout,
    codec: schemaViewLayoutCodec,
  });

  test("a later tab cold-starts to the view layout an earlier tab wrote", async () => {
    const earlierTab = await openSchemaViewTab();
    const written: SchemaViewLayout = {
      ...defaultSchemaViewLayout,
      activeSidebarItem: "styles",
      sidebar: { width: 480 },
    };
    await earlierTab.write(written);

    const freshTab = await openSchemaViewTab();

    expect(freshTab.read()).toStrictEqual(written);
  });
});
