import type { PersistenceStatusStore } from "./persistenceStatusStore";

import {
  classifyStorageError,
  type StorageErrorClassification,
} from "./classifyStorageError";

/** Persists the latest value for a key to the backing store. */
export type Flush = () => Promise<void>;

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 100;

/** Exponential backoff: 100ms, 200ms, 400ms, … */
function exponentialBackoff(attempt: number) {
  return new Promise<void>(resolve =>
    setTimeout(resolve, DEFAULT_BASE_DELAY_MS * 2 ** attempt),
  );
}

export interface WriteQueueConfig {
  store: PersistenceStatusStore;
  /** Backoff before retry `attempt` (0-based). Injectable for tests. */
  delay?: (attempt: number) => Promise<void>;
  /** Total attempts before a retryable failure escalates to terminal. */
  maxAttempts?: number;
}

export interface WriteQueue {
  /**
   * Schedules a write for `key`. Returns immediately. Writes to the same key
   * are serialized; a write enqueued while one is in flight replaces any other
   * pending write for that key (coalesce-to-latest), so only the newest value
   * is persisted.
   */
  enqueue(key: string, flush: Flush): void;
}

/**
 * Serializes, coalesces, and retries IndexedDB writes per key, reporting
 * outcomes to the persistence-status store.
 *
 * It knows nothing about IndexedDB, Jotai, or the value being written — only a
 * `flush` thunk. That keeps the cross-tab merge (a separate concern) orthogonal:
 * it lives inside whatever `flush` the caller supplies.
 */
export function createWriteQueue({
  store,
  delay = exponentialBackoff,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: WriteQueueConfig): WriteQueue {
  // The write currently running for a key, plus the next flush waiting to run.
  const running = new Map<string, Promise<void>>();
  const pending = new Map<string, Flush>();

  /** Runs one flush with retry, returning the terminal failure if it gives up. */
  async function runWithRetry(
    flush: Flush,
  ): Promise<StorageErrorClassification | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await flush();
        return null;
      } catch (error) {
        const classification = classifyStorageError(error);
        const isLastAttempt = attempt === maxAttempts - 1;
        if (classification !== "retryable" || isLastAttempt) {
          return classification;
        }
        await delay(attempt);
      }
    }
    return null;
  }

  async function drain(key: string) {
    store.markSaving(key);
    let failure: StorageErrorClassification | null = null;

    let next = pending.get(key);
    while (next) {
      pending.delete(key);
      failure = await runWithRetry(next);
      next = pending.get(key);
    }

    running.delete(key);
    if (failure) {
      store.markFailed(key, failure);
    } else {
      store.markSaved(key);
    }
  }

  return {
    enqueue(key, flush) {
      // Replace any not-yet-started write so only the latest value lands.
      pending.set(key, flush);
      if (!running.has(key)) {
        running.set(key, drain(key));
      }
    },
  };
}
