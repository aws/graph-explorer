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
