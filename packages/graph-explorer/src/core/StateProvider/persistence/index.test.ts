import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import { stubStorageManager } from "@/utils/testing";

async function loadPersistence() {
  return await import("./index");
}

describe("persistThroughQueue", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("asks for persistent storage once across several writes", async () => {
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi.fn().mockResolvedValue(true);
    stubStorageManager({ persist, persisted });
    const { persistThroughQueue, persistenceStatusStore } =
      await loadPersistence();
    const configurationFlush = vi.fn().mockResolvedValue(undefined);
    const schemaFlush = vi.fn().mockResolvedValue(undefined);

    persistThroughQueue("configuration", configurationFlush);
    persistThroughQueue("schema", schemaFlush);
    await persistenceStatusStore.waitForIdle();

    expect(persist).toHaveBeenCalledOnce();
    expect(persisted).toHaveBeenCalledOnce();
    expect(configurationFlush).toHaveBeenCalledOnce();
    expect(schemaFlush).toHaveBeenCalledOnce();
  });

  test("writes when the Storage API is unavailable", async () => {
    stubStorageManager(undefined);
    const { persistThroughQueue, persistenceStatusStore } =
      await loadPersistence();
    const flush = vi.fn().mockResolvedValue(undefined);

    persistThroughQueue("configuration", flush);
    await persistenceStatusStore.waitForIdle();

    expect(flush).toHaveBeenCalledOnce();
    expect(persistenceStatusStore.getSnapshot().status).toBe("idle");
  });

  test("writes when the persistence request rejects", async () => {
    const persisted = vi.fn().mockResolvedValue(false);
    const persist = vi
      .fn()
      .mockRejectedValue(new DOMException("boom", "UnknownError"));
    stubStorageManager({ persist, persisted });
    const { persistThroughQueue, persistenceStatusStore } =
      await loadPersistence();
    const flush = vi.fn().mockResolvedValue(undefined);

    persistThroughQueue("configuration", flush);
    await persistenceStatusStore.waitForIdle();

    expect(flush).toHaveBeenCalledOnce();
    expect(persistenceStatusStore.getSnapshot().status).toBe("idle");
  });
});
