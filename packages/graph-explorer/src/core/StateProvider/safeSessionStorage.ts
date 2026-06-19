import { logger } from "@/utils";

/**
 * In-memory Storage used when sessionStorage is unavailable — either absent
 * (non-DOM contexts such as SSR or node-based tests) or blocked (accessing it
 * throws a SecurityError in sandboxed iframes or with storage disabled).
 */
export function createInMemorySessionStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: key => void map.delete(key),
    clear: () => map.clear(),
    key: index => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

/**
 * Returns a usable sessionStorage, degrading to an in-memory store when none is
 * available. Accessing `globalThis.sessionStorage` can throw a SecurityError
 * (not return undefined) when DOM storage is disabled, so the access is guarded
 * to avoid crashing app startup.
 */
export function resolveSessionStorage(): Storage {
  try {
    if (globalThis.sessionStorage) {
      logger.debug("Using browser sessionStorage for per-tab state");
      return globalThis.sessionStorage;
    }
    logger.warn(
      "sessionStorage is unavailable; falling back to in-memory storage. " +
        "Per-tab state will not survive a reload.",
    );
    return createInMemorySessionStorage();
  } catch (error) {
    logger.warn(
      "sessionStorage access threw; falling back to in-memory storage. " +
        "Per-tab state will not survive a reload.",
      error,
    );
    return createInMemorySessionStorage();
  }
}
