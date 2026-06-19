import type { StorageErrorClassification } from "./classifyStorageError";

/**
 * The single, global state of whether the app's client-side data is safely
 * written to IndexedDB.
 *
 * - `idle` — nothing queued and everything durable (also the fresh-session
 *   state; there is deliberately no separate "saved").
 * - `saving` — at least one write is queued or in flight, including retries.
 * - `failed` — at least one terminal failure is outstanding.
 */
export type PersistenceStatus = "idle" | "saving" | "failed";

/** A terminal write failure, surfaced for the drill-in detail view. */
export interface PersistenceFailure {
  key: string;
  reason: StorageErrorClassification;
}

export interface PersistenceStatusSnapshot {
  status: PersistenceStatus;
  failures: PersistenceFailure[];
}

export interface PersistenceStatusStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): PersistenceStatusSnapshot;
  /** A write for `key` has started or is being retried. */
  markSaving(key: string): void;
  /** A write for `key` landed durably; clears any prior failure for that key. */
  markSaved(key: string): void;
  /** A write for `key` failed terminally and will not be retried. */
  markFailed(key: string, reason: StorageErrorClassification): void;
  /**
   * Resolves once no write is in flight — i.e. status has settled to `idle` or
   * `failed`. The test seam that replaces awaiting a per-write promise.
   */
  waitForIdle(): Promise<void>;
}

/**
 * Creates a persistence-status store: a plain external store (outside
 * React/Jotai) that aggregates per-key write outcomes into one global status.
 *
 * Aggregation precedence: any terminal failure → `failed`; else any in-flight
 * key → `saving`; else `idle`.
 */
export function createPersistenceStatusStore(): PersistenceStatusStore {
  const inFlightKeys = new Set<string>();
  const failuresByKey = new Map<string, StorageErrorClassification>();
  const listeners = new Set<() => void>();

  let snapshot: PersistenceStatusSnapshot = { status: "idle", failures: [] };

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function recompute() {
    const status: PersistenceStatus = failuresByKey.size
      ? "failed"
      : inFlightKeys.size
        ? "saving"
        : "idle";
    const failures = [...failuresByKey].map(([key, reason]) => ({
      key,
      reason,
    }));

    snapshot = { status, failures };
    listeners.forEach(listener => listener());
  }

  return {
    subscribe,
    getSnapshot() {
      return snapshot;
    },
    markSaving(key) {
      inFlightKeys.add(key);
      recompute();
    },
    markSaved(key) {
      inFlightKeys.delete(key);
      failuresByKey.delete(key);
      recompute();
    },
    markFailed(key, reason) {
      inFlightKeys.delete(key);
      failuresByKey.set(key, reason);
      recompute();
    },
    waitForIdle() {
      if (snapshot.status !== "saving") {
        return Promise.resolve();
      }
      return new Promise<void>(resolve => {
        const unsubscribe = subscribe(() => {
          if (snapshot.status !== "saving") {
            unsubscribe();
            resolve();
          }
        });
      });
    },
  };
}
