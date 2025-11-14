import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type ConfigurationId,
  schemaAtom,
} from "@/core";
import { logger } from "@/utils";
import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

export function useDeleteConfig() {
  return useAtomCallback(
    useCallback((_get, set, id: ConfigurationId) => {
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
    }, [])
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
