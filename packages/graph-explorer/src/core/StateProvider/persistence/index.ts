import { createPersistenceStatusStore } from "./persistenceStatusStore";
import { createWriteQueue, type Flush } from "./writeQueue";

export type {
  PersistenceStatus,
  PersistenceStatusSnapshot,
  PersistenceFailure,
} from "./persistenceStatusStore";

/**
 * The app-wide persistence-status store. A single global instance because the
 * Persistence Status Indicator shows one aggregated status for the whole app.
 * Tests construct isolated stores via `createPersistenceStatusStore` instead.
 */
export const persistenceStatusStore = createPersistenceStatusStore();

const writeQueue = createWriteQueue({ store: persistenceStatusStore });

/**
 * Schedules an IndexedDB write for `key` through the shared retry/coalesce queue
 * so its outcome flows into the global persistence status. Returns immediately;
 * the queue owns retries and failure reporting.
 */
export function persistThroughQueue(key: string, flush: Flush): void {
  writeQueue.enqueue(key, flush);
}

/**
 * Forces a terminal write failure through the real queue, for exercising the
 * Persistence Status Indicator from the debug actions. Drives the genuine path
 * (classify → markFailed → status), so the indicator and its detail dialog
 * behave exactly as they would for a real failure.
 *
 * @param kind `"quota"` raises a `QuotaExceededError` (offers a backup);
 * `"access"` raises a `SecurityError` (no backup).
 */
export function debugForcePersistenceFailure(kind: "quota" | "access"): void {
  const key = kind === "quota" ? "graph-sessions" : "configuration";
  const errorName = kind === "quota" ? "QuotaExceededError" : "SecurityError";
  persistThroughQueue(key, () =>
    Promise.reject(new DOMException("Forced debug failure", errorName)),
  );
}
