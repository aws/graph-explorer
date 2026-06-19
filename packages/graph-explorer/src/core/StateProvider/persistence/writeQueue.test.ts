import { describe, expect, test, vi } from "vitest";

import { createPersistenceStatusStore } from "./persistenceStatusStore";
import { createWriteQueue } from "./writeQueue";

function quotaError() {
  return new DOMException("full", "QuotaExceededError");
}

function noDelay() {
  return Promise.resolve();
}

describe("createWriteQueue", () => {
  test("flushes a single enqueued write and settles to idle", async () => {
    const store = createPersistenceStatusStore();
    const queue = createWriteQueue({ store, delay: noDelay });
    const flush = vi.fn().mockResolvedValue(undefined);

    queue.enqueue("configuration", flush);
    await store.waitForIdle();

    expect(flush).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe("idle");
  });

  test("coalesces writes enqueued while one is in flight to only the latest", async () => {
    const store = createPersistenceStatusStore();
    const queue = createWriteQueue({ store, delay: noDelay });

    let releaseFirst!: () => void;
    const first = vi.fn(
      () => new Promise<void>(resolve => (releaseFirst = resolve)),
    );
    const superseded = vi.fn().mockResolvedValue(undefined);
    const latest = vi.fn().mockResolvedValue(undefined);

    queue.enqueue("user-styling", first);
    // Both arrive while `first` is still in flight; only `latest` should run.
    queue.enqueue("user-styling", superseded);
    queue.enqueue("user-styling", latest);
    releaseFirst();
    await store.waitForIdle();

    expect(first).toHaveBeenCalledTimes(1);
    expect(superseded).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  test("retries a transient failure and settles to idle once it succeeds", async () => {
    const store = createPersistenceStatusStore();
    const delay = vi.fn(noDelay);
    const queue = createWriteQueue({ store, delay });
    const flush = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("conflict", "AbortError"))
      .mockResolvedValueOnce(undefined);

    queue.enqueue("schema", flush);
    await store.waitForIdle();

    expect(flush).toHaveBeenCalledTimes(2);
    expect(delay).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe("idle");
  });

  test("does not retry a terminal quota failure", async () => {
    const store = createPersistenceStatusStore();
    const delay = vi.fn(noDelay);
    const queue = createWriteQueue({ store, delay });
    const flush = vi.fn().mockRejectedValue(quotaError());

    queue.enqueue("graph-sessions", flush);
    await store.waitForIdle();

    expect(flush).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toStrictEqual({
      status: "failed",
      failures: [{ key: "graph-sessions", reason: "terminal-quota" }],
    });
  });

  test("escalates a persistently transient failure to terminal after the cap", async () => {
    const store = createPersistenceStatusStore();
    const queue = createWriteQueue({ store, delay: noDelay });
    const flush = vi
      .fn()
      .mockRejectedValue(new DOMException("hiccup", "UnknownError"));

    queue.enqueue("configuration", flush);
    await store.waitForIdle();

    expect(flush).toHaveBeenCalledTimes(3);
    expect(store.getSnapshot()).toStrictEqual({
      status: "failed",
      failures: [{ key: "configuration", reason: "retryable" }],
    });
  });

  test("runs writes for different keys independently", async () => {
    const store = createPersistenceStatusStore();
    const queue = createWriteQueue({ store, delay: noDelay });
    const configFlush = vi.fn().mockResolvedValue(undefined);
    const schemaFlush = vi.fn().mockRejectedValue(quotaError());

    queue.enqueue("configuration", configFlush);
    queue.enqueue("schema", schemaFlush);
    await store.waitForIdle();

    expect(configFlush).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().failures).toStrictEqual([
      { key: "schema", reason: "terminal-quota" },
    ]);
  });
});
