import type { ConnectionConfig } from "@shared/types";

import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import { type RawConfiguration, resolveQueryEngine } from "@/connections";
import { allGraphSessionsAtom, configurationAtom, schemaAtom } from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { logger } from "@/utils";

import {
  type ConnectionFormValues,
  mapToConfiguration,
} from "./connectionFormModel";

/**
 * Returns a callback that saves changes to an existing connection. When the
 * change points it at a different database, its cached schema and graph
 * session describe the old one, so they are discarded.
 */
export function useUpdateConnection() {
  const resetState = useResetState();

  return useAtomCallback(
    useCallback(
      (get, set, config: RawConfiguration, values: ConnectionFormValues) => {
        const storedConfig = get(configurationAtom).get(config.id);
        if (!storedConfig) {
          throw new Error(`Cannot update missing connection ${config.id}`);
        }
        const updatedConfig = {
          ...storedConfig,
          ...mapToConfiguration(config.id, values),
        };
        const updatedConnection = updatedConfig.connection;
        logger.log("Updating existing connection", {
          storedConfig,
          updatedConfig,
        });
        set(configurationAtom, prev =>
          new Map(prev).set(config.id, updatedConfig),
        );

        if (targetsNewDatabase(storedConfig.connection, updatedConnection)) {
          logger.log(
            "Clearing cached schema and previous graph session because connection to database meaningfully changed",
            { original: storedConfig.connection, updatedConnection },
          );
          set(schemaAtom, prev => withoutKey(prev, config.id));
          set(allGraphSessionsAtom, prev => withoutKey(prev, config.id));
        }

        resetState();
      },
      [resetState],
    ),
  );
}

function targetsNewDatabase(
  original: ConnectionConfig | undefined,
  updated: ConnectionConfig,
): boolean {
  return (
    original?.graphDbUrl !== updated.graphDbUrl ||
    resolveQueryEngine(original) !== resolveQueryEngine(updated)
  );
}

function withoutKey<Key, Value>(map: Map<Key, Value>, key: Key) {
  const next = new Map(map);
  next.delete(key);
  return next;
}
