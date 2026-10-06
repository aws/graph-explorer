import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import { activeConnectionIdAtom } from "@/core/StateProvider/storageAtoms";
import useResetState from "@/core/StateProvider/useResetState";
import { logger } from "@/utils";

import type { ConnectionId } from "./types";

/**
 * Returns a callback that activates a connection and resets the graph session,
 * the same behavior as manually switching connections. Activating the connection
 * that is already active is a no-op, so the session survives.
 */
export default function useActivateConnection() {
  const resetState = useResetState();
  return useAtomCallback(
    useCallback(
      (get, set, connectionId: ConnectionId) => {
        if (get(activeConnectionIdAtom) === connectionId) {
          return;
        }
        logger.debug("Setting active connection to", connectionId);
        set(activeConnectionIdAtom, connectionId);
        resetState();
      },
      [resetState],
    ),
  );
}
