import logger from "./logger";

/**
 * Explicitly ignores a promise whose result the caller does not await, while
 * still observing failures by logging them.
 *
 * Use this for intentional fire-and-forget work where a rejection should not be
 * silently swallowed — most notably background persistence writes (see
 * `atomWithLocalForage`), which resolve synchronously in memory but may reject
 * when the durable write fails. For promises whose rejection is genuinely inert
 * (e.g. an aborted navigation), prefer the bare `void` operator instead.
 */
export function fireAndForget(promise: Promise<unknown>) {
  promise.catch(error => {
    logger.warn("Ignored promise rejection:", error);
  });
}
