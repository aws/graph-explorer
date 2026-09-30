import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import { createNewConfigurationId } from "@/connections";
import { configurationAtom } from "@/core";
import useActivateConnection from "@/core/StateProvider/useActivateConnection";
import { logger } from "@/utils";

import {
  type ConnectionFormValues,
  mapToConfiguration,
} from "./connectionFormModel";

/** Returns a callback that saves a new connection and switches to it. */
export function useCreateConnection() {
  const activateConnection = useActivateConnection();

  return useAtomCallback(
    useCallback(
      (_get, set, values: ConnectionFormValues) => {
        const newConfig = mapToConfiguration(
          createNewConfigurationId(),
          values,
        );
        logger.log("Saving new connection", newConfig);
        set(configurationAtom, prev =>
          new Map(prev).set(newConfig.id, newConfig),
        );
        activateConnection(newConfig.id);
      },
      [activateConnection],
    ),
  );
}
