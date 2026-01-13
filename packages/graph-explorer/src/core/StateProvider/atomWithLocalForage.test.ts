import { createStore } from "jotai";
import localforage from "localforage";
import { beforeEach, describe, expect, test } from "vitest";

import { atomWithLocalForage } from "./atomWithLocalForage";

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

    // Wait a bit for async persistence
    await new Promise(resolve => setTimeout(resolve, 10));

    const stored = await localforage.getItem(key);
    expect(stored).toBe("new-value");
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

    // Wait for async persistence
    await new Promise(resolve => setTimeout(resolve, 10));

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

    // Wait for async persistence
    await new Promise(resolve => setTimeout(resolve, 10));

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
