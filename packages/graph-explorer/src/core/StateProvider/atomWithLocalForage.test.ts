import { describe, expect, test, beforeEach } from "vitest";
import { createStore } from "jotai";
import localforage from "localforage";
import { atomWithLocalForage } from "./atomWithLocalForage";

describe("atomWithLocalForage", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    // Clear localforage before each test
    await localforage.clear();
  });

  test("should return initial value on first read", () => {
    const atom = atomWithLocalForage("test-key", "initial");
    const value = store.get(atom);
    expect(value).toBe("initial");
  });

  test("should persist writes to localforage", async () => {
    const key = "test-write";
    const atom = atomWithLocalForage(key, "initial");

    store.set(atom, "new-value");

    // Wait a bit for async persistence
    await new Promise(resolve => setTimeout(resolve, 10));

    const stored = await localforage.getItem(key);
    expect(stored).toBe("new-value");
  });

  test("should handle function updates", () => {
    const atom = atomWithLocalForage("test-fn", 10);

    store.set(atom, prev => prev + 5);

    expect(store.get(atom)).toBe(15);
  });

  test("should prioritize writes over loads", async () => {
    const key = "test-priority";
    const storedValue = "stored";
    const newValue = "new";

    // Pre-populate localforage
    await localforage.setItem(key, storedValue);

    const atom = atomWithLocalForage(key, "initial");

    // Trigger load by reading
    store.get(atom);

    // Immediately write before load completes
    store.set(atom, newValue);

    // The write should take precedence
    expect(store.get(atom)).toBe(newValue);

    // Wait a bit and verify the write wasn't overwritten by the load
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(store.get(atom)).toBe(newValue);
  });

  test("should handle null values in storage", async () => {
    const key = "test-null";
    await localforage.setItem(key, null);

    const atom = atomWithLocalForage(key, "initial");

    store.get(atom);

    // Should keep initial value when storage has null
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(store.get(atom)).toBe("initial");
  });

  test("should handle undefined values in storage", async () => {
    const key = "test-undefined";
    await localforage.removeItem(key);

    const atom = atomWithLocalForage(key, "initial");

    store.get(atom);

    // Should keep initial value when storage is empty
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(store.get(atom)).toBe("initial");
  });

  test("should handle complex objects", async () => {
    const key = "test-object";
    const complexObject = {
      nested: { value: 42 },
      array: [1, 2, 3],
      map: new Map([["key", "value"]]),
    };

    const atom = atomWithLocalForage(key, {});

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

    const atom = atomWithLocalForage(key, complexObject);

    // Wait for async init
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should be same referential instance
    expect(store.get(atom)).toBe(complexObject);
    expect(store.get(atom)).toBe(complexObject);
    expect(store.get(atom)).toBe(complexObject);
  });

  test("should handle rapid successive writes", async () => {
    const key = "test-rapid-writes";
    const atom = atomWithLocalForage(key, 0);

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

  test("should handle write during load correctly", async () => {
    const key = "test-write-during-load";
    const storedValue = "old-value";
    const newValue = "new-value";

    await localforage.setItem(key, storedValue);

    const atom = atomWithLocalForage(key, "initial");

    // Start the load
    store.get(atom);

    // Write immediately (while load is in progress)
    store.set(atom, newValue);

    // The new value should be visible immediately
    expect(store.get(atom)).toBe(newValue);

    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // After load completes, the new value should still be there
    expect(store.get(atom)).toBe(newValue);

    // And it should be persisted
    const stored = await localforage.getItem(key);
    expect(stored).toBe(newValue);
  });

  test("should handle multiple writes during load", async () => {
    const key = "test-multiple-writes-during-load";
    await localforage.setItem(key, "old");

    const atom = atomWithLocalForage(key, "initial");

    // Start load
    store.get(atom);

    // Multiple writes during load
    store.set(atom, "write1");
    store.set(atom, "write2");
    store.set(atom, "write3");

    // Last write should win
    expect(store.get(atom)).toBe("write3");

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(store.get(atom)).toBe("write3");
  });

  test("should work with different data types", () => {
    // String
    const stringAtom = atomWithLocalForage("test-string", "hello");
    store.set(stringAtom, "world");
    expect(store.get(stringAtom)).toBe("world");

    // Number
    const numberAtom = atomWithLocalForage("test-number", 42);
    store.set(numberAtom, 100);
    expect(store.get(numberAtom)).toBe(100);

    // Boolean
    const boolAtom = atomWithLocalForage("test-bool", false);
    store.set(boolAtom, true);
    expect(store.get(boolAtom)).toBe(true);

    // Array
    const arrayAtom = atomWithLocalForage("test-array", [1, 2]);
    store.set(arrayAtom, [3, 4, 5]);
    expect(store.get(arrayAtom)).toEqual([3, 4, 5]);

    // Object
    const objAtom = atomWithLocalForage<Record<string, number>>("test-obj", {
      a: 1,
    });
    store.set(objAtom, { b: 2 });
    expect(store.get(objAtom)).toEqual({ b: 2 });
  });
});
