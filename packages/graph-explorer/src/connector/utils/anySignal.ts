/**
 * Returns an abort signal that is aborted when at least one of the specified
 * abort signals is aborted.
 *
 * Requires at least node.js 18.
 *
 * @param signals A variable amount of AbortSignal values that will be merged in to one.
 * @returns A single AbortSignal value or undefined if none are passed.
 */
export function anySignal(
  ...signals: (AbortSignal | null | undefined)[]
): AbortSignal | undefined {
  // Filter out null or undefined signals
  const filteredSignals = signals.flatMap(s => (s ? [s] : []));

  if (filteredSignals.length === 0) {
    return undefined;
  }

  const controller = new AbortController();
  for (const signal of filteredSignals) {
    if (signal.aborted) {
      // Exiting early if one of the signals
      // is already aborted.
      controller.abort(signal.reason);
      break;
    }

    // Listening for signals and removing the listeners
    // when at least one symbol is aborted.
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      signal: controller.signal,
    });
  }

  return controller.signal;
}
