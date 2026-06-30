import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import type { ConfigurationId } from "@/core";

import { logger } from "@/utils";

import { activeConfigurationAtom } from "./storageAtoms";
import useResetState from "./useResetState";

/**
 * Returns a callback that activates a connection and resets the graph session,
 * the same behavior as manually switching connections. Use this whenever the
 * active connection changes to a different connection.
 */
export default function useActivateConnection() {
  const resetState = useResetState();
  return useAtomCallback(
    useCallback(
      (_get, set, configId: ConfigurationId) => {
        logger.debug("Setting active connection to", configId);
        set(activeConfigurationAtom, configId);
        resetState();
      },
      [resetState],
    ),
  );
}
