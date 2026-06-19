import { describe, expect, test, vi } from "vitest";

import { logger } from "@/utils";

import {
  createInMemorySessionStorage,
  resolveSessionStorage,
} from "./safeSessionStorage";

describe("createInMemorySessionStorage", () => {
  test("round-trips values and removes them", () => {
    const storage = createInMemorySessionStorage();

    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");

    storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
  });
});

describe("resolveSessionStorage", () => {
  // The default test environment is non-DOM, so globalThis.sessionStorage is
  // undefined and resolveSessionStorage exercises the in-memory fallback.
  test("warns and falls back to in-memory storage when sessionStorage is unavailable", () => {
    const storage = resolveSessionStorage();

    expect(vi.mocked(logger.warn)).toHaveBeenCalledOnce();
    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
  });

  test("includes the thrown error in the warning when sessionStorage access throws", () => {
    const accessError = new Error("storage disabled");
    const original = Object.getOwnPropertyDescriptor(
      globalThis,
      "sessionStorage",
    );
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get() {
        throw accessError;
      },
    });

    try {
      const storage = resolveSessionStorage();

      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        expect.any(String),
        accessError,
      );
      storage.setItem("key", "value");
      expect(storage.getItem("key")).toBe("value");
    } finally {
      if (original) {
        Object.defineProperty(globalThis, "sessionStorage", original);
      } else {
        delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
      }
    }
  });
});
