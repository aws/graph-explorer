import { useSyncExternalStore } from "react";

import { persistenceStatusStore } from "./index";

/**
 * Subscribes a React component to the global persistence status. The status
 * store lives outside React/Jotai; this is the bridge.
 */
export function usePersistenceStatus() {
  return useSyncExternalStore(
    persistenceStatusStore.subscribe,
    persistenceStatusStore.getSnapshot,
  );
}
