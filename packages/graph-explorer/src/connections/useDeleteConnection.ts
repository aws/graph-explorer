import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  schemaAtom,
} from "@/core/StateProvider/storageAtoms";
import { logger } from "@/utils";

import type { ConnectionId } from "./types";

export function useDeleteConnection() {
  return useAtomCallback(
    useCallback((_get, set, id: ConnectionId) => {
      logger.log("Deleting connection:", id);
      set(activeConfigurationAtom, prev => {
        if (prev === id) {
          return null;
        }
        return prev;
      });

      set(configurationAtom, prevConfigs => {
        const updatedConfigs = new Map(prevConfigs);
        updatedConfigs.delete(id);
        return updatedConfigs;
      });

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        updatedSchemas.delete(id);
        return updatedSchemas;
      });

      set(allGraphSessionsAtom, prev => {
        const updatedGraphs = new Map(prev);
        updatedGraphs.delete(id);
        return updatedGraphs;
      });
    }, []),
  );
}

export function useDeleteActiveConnection() {
  const activeConfigId = useAtomValue(activeConfigurationAtom);
  const deleteConfig = useDeleteConnection();

  return () => {
    if (!activeConfigId) {
      return;
    }

    deleteConfig(activeConfigId);
  };
}
