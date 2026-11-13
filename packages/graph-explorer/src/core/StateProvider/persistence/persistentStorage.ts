import { logger } from "@/utils";

/** The Storage API, which browsers omit on insecure (plain http) origins. */
function getStorageManager(): StorageManager | undefined {
  return navigator.storage;
}

/**
 * Asks the browser to keep this origin's storage rather than evict it.
 * Resolves whether storage is persistent, or `null` when the Storage API is
 * unavailable or fails. Never rejects.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  const storage = getStorageManager();
  if (!storage) {
    logger.debug("Persistent storage unavailable: no Storage API");
    return null;
  }

  try {
    const persisted = (await storage.persisted()) || (await storage.persist());
    logger.debug(
      persisted ? "Persistent storage granted" : "Persistent storage denied",
    );
    return persisted;
  } catch (error) {
    logger.debug("Persistent storage request failed", error);
    return null;
  }
}

let persistentStorageRequest: Promise<boolean | null> | undefined;

/**
 * {@link requestPersistentStorage}, made at most once per page load. Every
 * caller shares the first request's result, so a Firefox permission prompt
 * shows at most once and the Settings hint reflects the user's answer.
 */
export function requestPersistentStorageOnce(): Promise<boolean | null> {
  persistentStorageRequest ??= requestPersistentStorage();
  return persistentStorageRequest;
}
