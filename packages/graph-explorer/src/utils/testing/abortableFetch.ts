/**
 * Mimics real `fetch`: rejects with the signal's abort reason once the
 * signal aborts, whichever underlying signal caused it. Used as a `fetch`
 * mock to test abort/timeout classification.
 */
export function abortableFetch(_uri: unknown, init: RequestInit) {
  return new Promise((_resolve, reject) => {
    const signal = init.signal;
    if (!signal) return;
    if (signal.aborted) {
      reject(signal.reason as Error);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason as Error));
  });
}
