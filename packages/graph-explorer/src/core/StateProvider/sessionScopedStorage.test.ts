import { createStore } from "jotai";
import localForage from "localforage";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { logger } from "@/utils";

import {
  defaultGraphViewLayout,
  type GraphViewLayout,
  graphViewLayoutCodec,
  transformGraphViewLayout,
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
 * Builds a tab-opener bound to one key/default/codec. Each opened tab has its
 * own Jotai store and sessionStorage (per-tab), while all tabs share the one
 * fake-indexeddb — exactly how same-origin tabs relate. Mirrors the
 * active-connection test harness, parameterized so each real codec can be
 * exercised through the same multi-tab sequences rather than only a toy codec.
 */
function tabOpener<T>(
  key: string,
  defaultValue: T,
  codec: SessionValueCodec<T>,
) {
  return async function openTab() {
    const sessionStorage = createInMemorySessionStorage();
    let store = createStore();
    let atom = await createSessionScopedAtom<T>({
      key,
      defaultValue,
      codec,
      sessionStorage,
    });
    return {
      read: () => store.get(atom),
      write: (value: T) => {
        store.set(atom, value);
        return persistenceStatusStore.waitForIdle();
      },
      reload: async () => {
        store = createStore();
        atom = await createSessionScopedAtom<T>({
          key,
          defaultValue,
          codec,
          sessionStorage,
        });
      },
    };
  };
}

const openTab = tabOpener<Counter>(KEY, { count: 0 }, counterCodec);

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

  test("normalizes the breadcrumb through transform and claims the normalized value", async () => {
    await localForage.setItem<Counter>(KEY, { count: 7 });
    const sessionStorage = createInMemorySessionStorage();

    const atom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      transform: loaded => ({ count: loaded.count * 10 }),
      sessionStorage,
    });

    const store = createStore();
    expect(store.get(atom)).toStrictEqual({ count: 70 });
    // The tab claims the normalized value, so a later reload reads it back
    // rather than re-normalizing an old shape every boot.
    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify({ count: 70 }));
  });

  test("leaves this tab's own session value and the default untransformed", async () => {
    const transform = vi.fn((loaded: Counter) => ({
      count: loaded.count * 10,
    }));
    const warmStorage = createInMemorySessionStorage();
    warmStorage.setItem(KEY, JSON.stringify({ count: 42 }));

    const warmAtom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      transform,
      sessionStorage: warmStorage,
    });
    const coldAtom = await createSessionScopedAtom<Counter>({
      key: KEY,
      defaultValue: { count: 0 },
      codec: counterCodec,
      transform,
      sessionStorage: createInMemorySessionStorage(),
    });

    const store = createStore();
    expect(store.get(warmAtom)).toStrictEqual({ count: 42 });
    expect(store.get(coldAtom)).toStrictEqual({ count: 0 });
    expect(transform).not.toHaveBeenCalled();
  });
});

describe("createSessionScopedAtom across tabs", () => {
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

    // The claimed per-tab value is the array-serialized form, pinned literally
    // so a serialize that dropped a field could not satisfy both sides at once.
    expect(sessionStorage.getItem(LAYOUT_KEY)).toBe(
      JSON.stringify({
        activeSidebarItem: "filters",
        activeToggles: ["graph-viewer", "table-view"],
        sidebar: { width: 321 },
        tableView: { height: 250 },
        detailsAutoOpenOnSelection: false,
      }),
    );
    // A warm reload off that value rebuilds the Set rather than re-seeding.
    expect(
      graphViewLayoutCodec.deserialize(sessionStorage.getItem(LAYOUT_KEY)),
    ).toStrictEqual(breadcrumb);
  });

  test("remaps a retired sidebar item in the breadcrumb on cold start", async () => {
    // A layout stored before node and edge styling merged into one panel. The
    // breadcrumb is the only path a retired shape can arrive by, so without the
    // transform the codec would reject the claimed value on every reload and the
    // sidebar would point at a panel that no longer exists.
    await localForage.setItem(LAYOUT_KEY, {
      ...defaultGraphViewLayout,
      activeSidebarItem: "nodes-styling",
    } as unknown as GraphViewLayout);

    const atom = await createSessionScopedAtom<GraphViewLayout>({
      key: LAYOUT_KEY,
      defaultValue: defaultGraphViewLayout,
      codec: graphViewLayoutCodec,
      transform: transformGraphViewLayout,
      sessionStorage: createInMemorySessionStorage(),
    });

    expect(createStore().get(atom).activeSidebarItem).toBe("styles");
  });
});

// The two layout atoms ride the same primitive as the active connection, so
// they get the same multi-tab assurances active-connection has — proven
// through their real codecs, not the toy counter codec. The graph view codec
// is the interesting one: its activeToggles Set must survive the array
// serialization across a write-in-one-tab / cold-start-in-another sequence.
describe("graph view layout across tabs", () => {
  const openGraphViewTab = tabOpener<GraphViewLayout>(
    "graph-view-layout",
    defaultGraphViewLayout,
    graphViewLayoutCodec,
  );

  test("changing layout in one tab does not change an already-open tab", async () => {
    const tabB = await openGraphViewTab();
    const tabBLayout: GraphViewLayout = {
      ...defaultGraphViewLayout,
      activeSidebarItem: "filters",
      activeToggles: new Set(["graph-viewer"]),
    };
    await tabB.write(tabBLayout);

    const tabA = await openGraphViewTab();
    await tabA.write({
      ...defaultGraphViewLayout,
      activeSidebarItem: "styles",
    });

    expect(tabB.read()).toStrictEqual(tabBLayout);
  });

  test("a later tab cold-starts to the layout an earlier tab wrote, with toggles rebuilt as a Set", async () => {
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

describe("schema view layout across tabs", () => {
  const openSchemaViewTab = tabOpener<SchemaViewLayout>(
    "schema-view-layout",
    defaultSchemaViewLayout,
    schemaViewLayoutCodec,
  );

  test("changing layout in one tab does not change an already-open tab", async () => {
    const tabB = await openSchemaViewTab();
    const tabBLayout: SchemaViewLayout = {
      ...defaultSchemaViewLayout,
      activeSidebarItem: "styles",
    };
    await tabB.write(tabBLayout);

    const tabA = await openSchemaViewTab();
    await tabA.write({
      ...defaultSchemaViewLayout,
      activeSidebarItem: "details",
    });

    expect(tabB.read()).toStrictEqual(tabBLayout);
  });

  test("a later tab cold-starts to the layout an earlier tab wrote", async () => {
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
