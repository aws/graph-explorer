import logger from "./logger";

/**
 * Logs a rejected promise's error and otherwise ignores it. Intended as a
 * `.catch` handler for promises the caller intentionally does not await:
 * `somePromise.catch(logAndIgnore)`.
 *
 * Use this when a rejection is meaningful enough to surface in the logs but
 * does not need to be awaited or propagated — most notably background
 * persistence writes (see `atomWithLocalForage`), which resolve synchronously
 * in memory but may reject when the durable write fails. It logs at `warn`
 * rather than `error` because an explicitly-ignored rejection is non-blocking
 * by construction: the in-memory state already updated and nothing downstream
 * is waiting on it. For promises whose rejection is genuinely inert (e.g. an
 * aborted navigation), prefer the bare `void` operator instead.
 */
export function logAndIgnore(error: unknown) {
  logger.warn("Ignored promise rejection:", error);
}
