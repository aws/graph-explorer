import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type ConfigurationId,
  schemaAtom,
} from "@/core";
import { logAndNotify, logger } from "@/utils";

export function useDeleteConfig() {
  return useAtomCallback(
    useCallback((_get, set, id: ConfigurationId) => {
      logger.log("Deleting connection:", id);
      set(activeConfigurationAtom, prev => {
        if (prev === id) {
          return null;
        }
        return prev;
      }).catch(logAndNotify("Failed to finish deleting the connection."));

      set(configurationAtom, prevConfigs => {
        const updatedConfigs = new Map(prevConfigs);
        updatedConfigs.delete(id);
        return updatedConfigs;
      }).catch(logAndNotify("Failed to finish deleting the connection."));

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        updatedSchemas.delete(id);
        return updatedSchemas;
      }).catch(logAndNotify("Failed to finish deleting the connection."));

      set(allGraphSessionsAtom, prev => {
        const updatedGraphs = new Map(prev);
        updatedGraphs.delete(id);
        return updatedGraphs;
      }).catch(logAndNotify("Failed to finish deleting the connection."));
    }, []),
  );
}

export function useDeleteActiveConfiguration() {
  const activeConfigId = useAtomValue(activeConfigurationAtom);
  const deleteConfig = useDeleteConfig();

  return () => {
    if (!activeConfigId) {
      return;
    }

    deleteConfig(activeConfigId);
  };
}
