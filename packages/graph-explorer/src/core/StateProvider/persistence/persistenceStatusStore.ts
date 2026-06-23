import type { ErrorDetails } from "@/utils/createErrorDetails";

import { logger } from "@/utils";

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
  /** How many attempts were made before giving up (including the first try). */
  attemptCount: number;
  /** When the final, failed attempt occurred. */
  lastAttemptAt: Date;
  /** Name, message, and any cause data from the underlying error. */
  details: ErrorDetails;
}

export interface PersistenceStatusSnapshot {
  status: PersistenceStatus;
  failures: PersistenceFailure[];
  /**
   * Whether any write is currently in flight. Distinct from `status === "saving"`
   * because a terminal failure on one key makes `status` `failed` while another
   * key may still be draining. Drives `waitForIdle`.
   */
  isSettling: boolean;
}

export interface PersistenceStatusStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): PersistenceStatusSnapshot;
  /** A write for `key` has started or is being retried. */
  markSaving(key: string): void;
  /** A write for `key` landed durably; clears any prior failure for that key. */
  markSaved(key: string): void;
  /** A write for `key` failed terminally and will not be retried. */
  markFailed(
    key: string,
    reason: StorageErrorClassification,
    attemptCount: number,
    details: ErrorDetails,
  ): void;
  /**
   * Resolves once no write is in flight. The test seam that replaces awaiting a
   * per-write promise. Resolves immediately when nothing is in flight, so a
   * write enqueued *after* this call is not awaited — issue all writes first.
   */
  waitForIdle(): Promise<void>;
  /** Clears all in-flight and failed state. Returns the store to `idle`. */
  reset(): void;
}

interface PersistenceStatusStoreConfig {
  /** Supplies the timestamp stamped on a failure. Injectable for tests. */
  now?: () => Date;
}

/**
 * Creates a persistence-status store: a plain external store (outside
 * React/Jotai) that aggregates per-key write outcomes into one global status.
 *
 * Aggregation precedence: any terminal failure → `failed`; else any in-flight
 * key → `saving`; else `idle`.
 */
export function createPersistenceStatusStore({
  now = () => new Date(),
}: PersistenceStatusStoreConfig = {}): PersistenceStatusStore {
  const inFlightKeys = new Set<string>();
  const failuresByKey = new Map<string, PersistenceFailure>();
  const listeners = new Set<() => void>();

  let snapshot: PersistenceStatusSnapshot = {
    status: "idle",
    failures: [],
    isSettling: false,
  };

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function snapshotsEqual(next: PersistenceStatusSnapshot) {
    return (
      next.status === snapshot.status &&
      next.isSettling === snapshot.isSettling &&
      next.failures.length === snapshot.failures.length &&
      next.failures.every(
        (failure, index) => failure === snapshot.failures[index],
      )
    );
  }

  function recompute() {
    const status: PersistenceStatus = failuresByKey.size
      ? "failed"
      : inFlightKeys.size
        ? "saving"
        : "idle";
    const next: PersistenceStatusSnapshot = {
      status,
      failures: [...failuresByKey.values()],
      isSettling: inFlightKeys.size > 0,
    };

    if (snapshotsEqual(next)) {
      return;
    }

    if (status !== snapshot.status) {
      logger.debug(`[persistence] status ${snapshot.status} → ${status}`);
    }

    snapshot = next;
    listeners.forEach(listener => listener());
  }

  return {
    subscribe,
    getSnapshot() {
      return snapshot;
    },
    markSaving(key) {
      logger.debug(`[persistence] saving "${key}"`);
      inFlightKeys.add(key);
      recompute();
    },
    markSaved(key) {
      logger.debug(`[persistence] saved "${key}"`);
      inFlightKeys.delete(key);
      failuresByKey.delete(key);
      recompute();
    },
    markFailed(key, reason, attemptCount, details) {
      logger.debug(
        `[persistence] failed "${key}" (${reason}, ${attemptCount} attempts)`,
      );
      inFlightKeys.delete(key);
      failuresByKey.set(key, {
        key,
        reason,
        attemptCount,
        lastAttemptAt: now(),
        details,
      });
      recompute();
    },
    waitForIdle() {
      if (!snapshot.isSettling) {
        return Promise.resolve();
      }
      return new Promise<void>(resolve => {
        const unsubscribe = subscribe(() => {
          if (!snapshot.isSettling) {
            unsubscribe();
            resolve();
          }
        });
      });
    },
    reset() {
      inFlightKeys.clear();
      failuresByKey.clear();
      recompute();
    },
  };
}
