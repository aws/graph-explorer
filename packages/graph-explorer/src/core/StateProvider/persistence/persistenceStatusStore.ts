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
  markFailed(
    key: string,
    reason: StorageErrorClassification,
    attemptCount: number,
  ): void;
  /**
   * Resolves once no write is in flight — i.e. status has settled to `idle` or
   * `failed`. The test seam that replaces awaiting a per-write promise.
   */
  waitForIdle(): Promise<void>;
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
  // Resolvers waiting for all in-flight writes to drain. Tracked separately
  // from `listeners` because idleness keys off the in-flight count, not the
  // snapshot — a snapshot-unchanged transition (e.g. the last in-flight key
  // settling while a failure remains) must still wake these.
  let idleWaiters: Array<() => void> = [];

  let snapshot: PersistenceStatusSnapshot = { status: "idle", failures: [] };

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function flushIdleWaitersIfDrained() {
    if (inFlightKeys.size > 0 || idleWaiters.length === 0) {
      return;
    }
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach(resolve => resolve());
  }

  function failuresEqual(next: PersistenceFailure[]) {
    const current = snapshot.failures;
    return (
      next.length === current.length &&
      next.every((failure, index) => failure === current[index])
    );
  }

  function recompute() {
    const status: PersistenceStatus = failuresByKey.size
      ? "failed"
      : inFlightKeys.size
        ? "saving"
        : "idle";
    const failures = [...failuresByKey.values()];

    if (status === snapshot.status && failuresEqual(failures)) {
      return;
    }

    if (status !== snapshot.status) {
      logger.debug(`[persistence] status ${snapshot.status} → ${status}`);
    }

    snapshot = { status, failures };
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
      flushIdleWaitersIfDrained();
    },
    markFailed(key, reason, attemptCount) {
      logger.debug(
        `[persistence] failed "${key}" (${reason}, ${attemptCount} attempts)`,
      );
      inFlightKeys.delete(key);
      failuresByKey.set(key, {
        key,
        reason,
        attemptCount,
        lastAttemptAt: now(),
      });
      recompute();
      flushIdleWaitersIfDrained();
    },
    waitForIdle() {
      // Resolve when no write is in flight, regardless of whether failures
      // remain. Keying off the in-flight count (not status) means a terminal
      // failure on one key does not prematurely signal "settled" while another
      // key is still draining.
      if (inFlightKeys.size === 0) {
        return Promise.resolve();
      }
      return new Promise<void>(resolve => {
        idleWaiters.push(resolve);
      });
    },
  };
}
