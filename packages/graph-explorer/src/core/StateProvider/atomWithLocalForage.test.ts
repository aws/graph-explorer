import { createStore } from "jotai";
import localforage from "localforage";
import { beforeEach, describe, expect, test } from "vitest";

import { atomWithLocalForage, reconcileMapByKey } from "./atomWithLocalForage";
import { persistenceStatusStore } from "./persistence";

describe("atomWithLocalForage", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    // Clear localforage before each test
    await localforage.clear();
  });

  test("should return initial value on first read", async () => {
    const atom = await atomWithLocalForage("test-key", "initial");
    const value = store.get(atom);
    expect(value).toBe("initial");
  });

  test("should persist writes to localforage", async () => {
    const key = "test-write";
    const atom = await atomWithLocalForage(key, "initial");

    store.set(atom, "new-value");
    await persistenceStatusStore.waitForIdle();

    const stored = await localforage.getItem(key);
    expect(stored).toBe("new-value");
  });

  test("should report persistence status while a write lands", async () => {
    const atom = await atomWithLocalForage("test-status", "initial");

    store.set(atom, "new-value");
    expect(persistenceStatusStore.getSnapshot().status).toBe("saving");

    await persistenceStatusStore.waitForIdle();
    expect(persistenceStatusStore.getSnapshot().status).toBe("idle");
  });

  test("should handle function updates", async () => {
    const atom = await atomWithLocalForage("test-fn", 10);

    store.set(atom, prev => prev + 5);

    expect(store.get(atom)).toBe(15);
  });

  test("should load stored value on creation", async () => {
    const key = "test-load";
    const storedValue = "stored";

    // Pre-populate localforage
    await localforage.setItem(key, storedValue);

    const atom = await atomWithLocalForage(key, "initial");

    // Should have loaded the stored value
    expect(store.get(atom)).toBe(storedValue);
  });

  test("should handle null values in storage", async () => {
    const key = "test-null";
    await localforage.setItem(key, null);

    const atom = await atomWithLocalForage(key, "initial");

    // Should keep initial value when storage has null
    expect(store.get(atom)).toBe("initial");
  });

  test("should handle undefined values in storage", async () => {
    const key = "test-undefined";
    await localforage.removeItem(key);

    const atom = await atomWithLocalForage(key, "initial");

    // Should keep initial value when storage is empty
    expect(store.get(atom)).toBe("initial");
  });

  test("should handle complex objects", async () => {
    const key = "test-object";
    const complexObject = {
      nested: { value: 42 },
      array: [1, 2, 3],
      map: new Map([["key", "value"]]),
    };

    const atom = await atomWithLocalForage(key, {});

    store.set(atom, complexObject);

    expect(store.get(atom)).toBe(complexObject);

    await persistenceStatusStore.waitForIdle();

    const stored = await localforage.getItem(key);
    expect(stored).toEqual(complexObject);
  });

  test("should return the same instance on successive reads", async () => {
    const key = "test-object";
    const complexObject = {
      nested: { value: 42 },
      array: [1, 2, 3],
      map: new Map([["key", "value"]]),
    };

    const atom = await atomWithLocalForage(key, complexObject);

    // Should be same referential instance
    expect(store.get(atom)).toBe(complexObject);
    expect(store.get(atom)).toBe(complexObject);
    expect(store.get(atom)).toBe(complexObject);
  });

  test("should handle rapid successive writes", async () => {
    const key = "test-rapid-writes";
    const atom = await atomWithLocalForage(key, 0);

    // Rapid writes
    store.set(atom, 1);
    store.set(atom, 2);
    store.set(atom, 3);

    expect(store.get(atom)).toBe(3);

    await persistenceStatusStore.waitForIdle();

    const stored = await localforage.getItem(key);
    expect(stored).toBe(3);
  });

  test("should work with different data types", async () => {
    // String
    const stringAtom = await atomWithLocalForage("test-string", "hello");
    store.set(stringAtom, "world");
    expect(store.get(stringAtom)).toBe("world");

    // Number
    const numberAtom = await atomWithLocalForage("test-number", 42);
    store.set(numberAtom, 100);
    expect(store.get(numberAtom)).toBe(100);

    // Boolean
    const boolAtom = await atomWithLocalForage("test-bool", false);
    store.set(boolAtom, true);
    expect(store.get(boolAtom)).toBe(true);

    // Array
    const arrayAtom = await atomWithLocalForage("test-array", [1, 2]);
    store.set(arrayAtom, [3, 4, 5]);
    expect(store.get(arrayAtom)).toEqual([3, 4, 5]);

    // Object
    const objAtom = await atomWithLocalForage<Record<string, number>>(
      "test-obj",
      {
        a: 1,
      },
    );
    store.set(objAtom, { b: 2 });
    expect(store.get(objAtom)).toEqual({ b: 2 });
  });
});

describe("reconcileMapByKey", () => {
  test("preserves a sibling key another tab added", () => {
    // This tab loaded empty and added its own key.
    const previous = new Map<string, string>();
    const next = new Map([["own", "mine"]]);
    // Another tab persisted a sibling key in the meantime.
    const persisted = new Map([["sibling", "theirs"]]);

    const merged = reconcileMapByKey({ persisted, previous, next });

    expect(merged.size).toBe(2);
    expect(merged.get("sibling")).toBe("theirs");
    expect(merged.get("own")).toBe("mine");
  });

  test("applies this tab's update over the persisted entry for the same key", () => {
    const previous = new Map([["shared", "before"]]);
    const next = new Map([["shared", "after"]]);
    const persisted = new Map([["shared", "concurrent"]]);

    const merged = reconcileMapByKey({ persisted, previous, next });

    expect(merged.size).toBe(1);
    expect(merged.get("shared")).toBe("after");
  });

  test("drops a key this tab removed while keeping a sibling", () => {
    const previous = new Map([["removed", "gone"]]);
    const next = new Map<string, string>();
    const persisted = new Map([
      ["removed", "gone"],
      ["sibling", "theirs"],
    ]);

    const merged = reconcileMapByKey({ persisted, previous, next });

    expect(merged.size).toBe(1);
    expect(merged.get("sibling")).toBe("theirs");
  });

  test("leaves a key this tab never touched at the value another tab wrote", () => {
    // This tab only ever edited "own"; "sibling" stayed identical between its
    // previous and next, so another tab's concurrent change to it must win.
    const previous = new Map([
      ["own", "before"],
      ["sibling", "stale"],
    ]);
    const next = new Map([
      ["own", "after"],
      ["sibling", "stale"],
    ]);
    const persisted = new Map([["sibling", "concurrent"]]);

    const merged = reconcileMapByKey({ persisted, previous, next });

    expect(merged.get("sibling")).toBe("concurrent");
    expect(merged.get("own")).toBe("after");
  });

  test("preserves this tab's keys when persisted has been wiped", () => {
    // Storage was cleared (or never written) between preload and persist.
    const previous = new Map<string, string>();
    const next = new Map([
      ["x", "mine-x"],
      ["y", "mine-y"],
    ]);
    const persisted = new Map<string, string>();

    const merged = reconcileMapByKey({ persisted, previous, next });

    expect(merged.size).toBe(2);
    expect(merged.get("x")).toBe("mine-x");
    expect(merged.get("y")).toBe("mine-y");
  });

  test("drops every previous key while preserving a foreign sibling in persisted", () => {
    // This tab cleared all its known entries; meanwhile another tab wrote a
    // foreign key the removal sweep must leave alone.
    const previous = new Map([
      ["x", "had-x"],
      ["y", "had-y"],
    ]);
    const next = new Map<string, string>();
    const persisted = new Map([
      ["x", "had-x"],
      ["y", "had-y"],
      ["z", "from-another-tab"],
    ]);

    const merged = reconcileMapByKey({ persisted, previous, next });

    expect(merged.size).toBe(1);
    expect(merged.get("z")).toBe("from-another-tab");
  });

  test("does not detect an entry mutated in place — write sites must replace entries, not mutate them", () => {
    // The reference-equality diff only works because every production write
    // site replaces a whole entry (`new Map(prev).set(id, freshEntry)`) rather
    // than mutating one in place. This pins that contract: if a tab mutates the
    // SAME entry object (so `previous` and `next` hold one shared reference),
    // `Object.is` sees no change, the mutation is NOT upserted, and a concurrent
    // value another tab wrote for that key survives instead.
    const sharedEntry = { value: "original" };
    const previous = new Map([["key", sharedEntry]]);

    // Mutate in place and reuse the same reference as `next`.
    sharedEntry.value = "mutated-in-place";
    const next = new Map([["key", sharedEntry]]);

    const concurrentEntry = { value: "from-another-tab" };
    const persisted = new Map([["key", concurrentEntry]]);

    const merged = reconcileMapByKey({ persisted, previous, next });

    // The in-place mutation is invisible to the diff, so the concurrent value
    // wins — demonstrating why write sites must construct fresh entries.
    expect(merged.get("key")).toBe(concurrentEntry);
  });
});
