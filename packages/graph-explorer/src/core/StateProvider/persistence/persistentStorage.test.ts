import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import { stubStorageManager } from "@/utils/testing";

import { requestPersistentStorage } from "./persistentStorage";

describe("requestPersistentStorage", () => {
  test("resolves true without asking again when storage is already persistent", async () => {
    const persisted = vi.fn().mockResolvedValue(true);
    const persist = vi.fn();
    stubStorageManager({ persist, persisted });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  test("resolves true when the browser grants persistence", async () => {
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi.fn().mockResolvedValue(true);
    stubStorageManager({ persist, persisted });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  test("resolves false when the browser denies persistence", async () => {
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi.fn().mockResolvedValue(false);
    stubStorageManager({ persist, persisted });

    await expect(requestPersistentStorage()).resolves.toBe(false);
  });

  test("resolves null when the Storage API is unavailable", async () => {
    stubStorageManager(undefined);

    await expect(requestPersistentStorage()).resolves.toBeNull();
  });

  test("resolves null when the request rejects", async () => {
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi
      .fn()
      .mockRejectedValue(new DOMException("boom", "UnknownError"));
    stubStorageManager({ persist, persisted });

    await expect(requestPersistentStorage()).resolves.toBeNull();
  });
});

describe("requestPersistentStorageOnce", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("shares the first request's result with every caller", async () => {
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi.fn().mockResolvedValue(true);
    stubStorageManager({ persist, persisted });
    const { requestPersistentStorageOnce } =
      await import("./persistentStorage");

    const results = await Promise.all([
      requestPersistentStorageOnce(),
      requestPersistentStorageOnce(),
    ]);

    expect(results).toStrictEqual([true, true]);
    expect(persist).toHaveBeenCalledOnce();
  });
});
