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
import { logAndIgnore, logger } from "@/utils";

export function useDeleteConfig() {
  return useAtomCallback(
    useCallback((_get, set, id: ConfigurationId) => {
      logger.log("Deleting connection:", id);
      set(activeConfigurationAtom, prev => {
        if (prev === id) {
          return null;
        }
        return prev;
      }).catch(logAndIgnore);

      set(configurationAtom, prevConfigs => {
        const updatedConfigs = new Map(prevConfigs);
        updatedConfigs.delete(id);
        return updatedConfigs;
      }).catch(logAndIgnore);

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        updatedSchemas.delete(id);
        return updatedSchemas;
      }).catch(logAndIgnore);

      set(allGraphSessionsAtom, prev => {
        const updatedGraphs = new Map(prev);
        updatedGraphs.delete(id);
        return updatedGraphs;
      }).catch(logAndIgnore);
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
