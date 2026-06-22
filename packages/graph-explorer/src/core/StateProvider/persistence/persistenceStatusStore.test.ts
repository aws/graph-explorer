import { describe, expect, test, vi } from "vitest";

import { createPersistenceStatusStore } from "./persistenceStatusStore";

describe("persistenceStatusStore", () => {
  test("starts idle with no failures", () => {
    const store = createPersistenceStatusStore();

    expect(store.getSnapshot()).toStrictEqual({ status: "idle", failures: [] });
  });

  test("reports saving while a key is in flight", () => {
    const store = createPersistenceStatusStore();

    store.markSaving("configuration");

    expect(store.getSnapshot().status).toBe("saving");
  });

  test("returns to idle once an in-flight key is saved", () => {
    const store = createPersistenceStatusStore();

    store.markSaving("configuration");
    store.markSaved("configuration");

    expect(store.getSnapshot().status).toBe("idle");
  });

  test("a terminal failure takes precedence over other in-flight writes", () => {
    const store = createPersistenceStatusStore();

    store.markSaving("schema");
    store.markFailed("configuration", "terminal-quota");

    const snapshot = store.getSnapshot();
    expect(snapshot.status).toBe("failed");
    expect(snapshot.failures).toStrictEqual([
      { key: "configuration", reason: "terminal-quota" },
    ]);
  });

  test("a failed key clears on its next successful write", () => {
    const store = createPersistenceStatusStore();

    store.markFailed("user-styling", "terminal-quota");
    store.markSaved("user-styling");

    expect(store.getSnapshot()).toStrictEqual({
      status: "idle",
      failures: [],
    });
  });

  test("stays failed while another key still has an outstanding failure", () => {
    const store = createPersistenceStatusStore();

    store.markFailed("schema", "terminal-access");
    store.markFailed("user-styling", "terminal-quota");
    store.markSaved("schema");

    const snapshot = store.getSnapshot();
    expect(snapshot.status).toBe("failed");
    expect(snapshot.failures).toStrictEqual([
      { key: "user-styling", reason: "terminal-quota" },
    ]);
  });

  test("notifies subscribers on change and stops after unsubscribe", () => {
    const store = createPersistenceStatusStore();
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    store.markSaving("configuration");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.markSaved("configuration");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("waitForIdle resolves once outstanding writes drain", async () => {
    const store = createPersistenceStatusStore();
    store.markSaving("configuration");

    const idle = store.waitForIdle();
    store.markSaved("configuration");

    await expect(idle).resolves.toBeUndefined();
  });

  test("waitForIdle resolves immediately when already idle", async () => {
    const store = createPersistenceStatusStore();

    await expect(store.waitForIdle()).resolves.toBeUndefined();
  });

  test("waitForIdle resolves once a failure is the only thing outstanding", async () => {
    const store = createPersistenceStatusStore();
    store.markSaving("schema");

    const idle = store.waitForIdle();
    store.markFailed("schema", "terminal-quota");

    await expect(idle).resolves.toBeUndefined();
  });

  test("waitForIdle does not resolve while another key is still in flight after a failure", async () => {
    const store = createPersistenceStatusStore();
    store.markSaving("configuration");
    store.markSaving("schema");

    let resolved = false;
    const idle = store.waitForIdle().then(() => {
      resolved = true;
    });

    // One key fails terminally, but the other is still draining. Status flips to
    // "failed", yet a write is genuinely still in flight, so idle must wait.
    store.markFailed("configuration", "terminal-quota");
    await Promise.resolve();
    expect(resolved).toBe(false);

    store.markSaved("schema");
    await idle;
    expect(resolved).toBe(true);
  });
});
