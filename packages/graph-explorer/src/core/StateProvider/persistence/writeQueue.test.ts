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
    expect(store.getSnapshot().status).toBe("failed");
    expect(store.getSnapshot().failures).toMatchObject([
      {
        key: "graph-sessions",
        reason: "terminal-quota",
        attemptCount: 1,
        // The thrown error's name and message are captured on the record.
        details: { name: "QuotaExceededError", message: "full" },
      },
    ]);
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
    expect(store.getSnapshot().status).toBe("failed");
    expect(store.getSnapshot().failures).toMatchObject([
      { key: "configuration", reason: "retryable", attemptCount: 3 },
    ]);
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
    expect(store.getSnapshot().failures).toMatchObject([
      { key: "schema", reason: "terminal-quota" },
    ]);
  });

  test("captures the underlying error's cause chain on the failure record", async () => {
    const store = createPersistenceStatusStore();
    const queue = createWriteQueue({ store, delay: noDelay });
    const error = new Error("could not open database", {
      cause: new Error("disk write failed"),
    });
    const flush = vi.fn().mockRejectedValue(error);

    queue.enqueue("configuration", flush);
    await store.waitForIdle();

    const [failure] = store.getSnapshot().failures;
    expect(failure.details).toMatchObject({
      name: "Error",
      message: "could not open database",
    });
    // createErrorDetails serializes the cause into the `data` field.
    expect(failure.details.data).toContain("disk write failed");
  });

  test("records each failed key's own error details", async () => {
    const store = createPersistenceStatusStore();
    const queue = createWriteQueue({ store, delay: noDelay });

    queue.enqueue("configuration", () =>
      Promise.reject(new DOMException("full", "QuotaExceededError")),
    );
    queue.enqueue("schema", () =>
      Promise.reject(new DOMException("blocked", "SecurityError")),
    );
    await store.waitForIdle();

    const detailsByKey = Object.fromEntries(
      store.getSnapshot().failures.map(f => [f.key, f.details.name]),
    );
    expect(detailsByKey).toStrictEqual({
      configuration: "QuotaExceededError",
      schema: "SecurityError",
    });
  });
});
