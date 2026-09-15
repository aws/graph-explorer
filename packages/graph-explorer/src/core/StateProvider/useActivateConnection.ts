import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import type { ConfigurationId } from "@/core";

import { logger } from "@/utils";

import { activeConfigurationAtom } from "./storageAtoms";
import useResetState from "./useResetState";

/**
 * Returns a callback that activates a connection and resets the graph session,
 * the same behavior as manually switching connections. Activating the connection
 * that is already active is a no-op, so the session survives.
 */
export default function useActivateConnection() {
  const resetState = useResetState();
  return useAtomCallback(
    useCallback(
      (get, set, configId: ConfigurationId) => {
        if (get(activeConfigurationAtom) === configId) {
          return;
        }
        logger.debug("Setting active connection to", configId);
        set(activeConfigurationAtom, configId);
        resetState();
      },
      [resetState],
    ),
  );
}
