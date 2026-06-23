/**
 * How a failed IndexedDB write should be handled.
 *
 * - `terminal-quota` — the store is full. Retrying writes the same bytes, so it
 *   cannot succeed; the user must free space or back up their data.
 * - `terminal-access` — IndexedDB is unavailable (private-browsing restriction,
 *   blocked by policy). The database never opens, so retrying is futile.
 * - `retryable` — a transient failure (transaction conflict, I/O hiccup, or an
 *   error we cannot positively identify). Worth retrying with backoff.
 */
export type StorageErrorClassification =
  | "terminal-quota"
  | "terminal-access"
  | "retryable";

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}

/**
 * Classifies an IndexedDB write failure so the write queue can decide whether to
 * retry or surface it as terminal.
 *
 * Unknown errors default to `retryable`: a transient failure wrongly treated as
 * terminal loses recoverable data, whereas a terminal failure wrongly retried
 * only wastes a few capped backoff cycles before escalating anyway.
 */
export function classifyStorageError(
  error: unknown,
): StorageErrorClassification {
  switch (errorName(error)) {
    case "QuotaExceededError":
      return "terminal-quota";
    case "SecurityError":
      return "terminal-access";
    default:
      // Everything else — including InvalidStateError, which IndexedDB also
      // raises for transient transaction/cursor states, not only a database
      // that never opened — is retryable. Retryable-by-default is the safer
      // error: a transient failure wrongly called terminal loses recoverable
      // data, while a terminal one wrongly retried just burns a few capped
      // backoff cycles.
      return "retryable";
  }
}
