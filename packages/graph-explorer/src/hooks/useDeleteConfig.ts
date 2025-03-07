import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  ConfigurationId,
  schemaAtom,
} from "@/core";
import { logger } from "@/utils";
import { useCallback } from "react";
import { useRecoilCallback, useRecoilValue } from "recoil";

export function useDeleteConfig() {
  return useRecoilCallback(
    ({ set }) =>
      (id: ConfigurationId) => {
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
      },
    []
  );
}

export function useDeleteActiveConfiguration() {
  const activeConfigId = useRecoilValue(activeConfigurationAtom);
  const deleteConfig = useDeleteConfig();

  return useCallback(() => {
    if (!activeConfigId) {
      return;
    }

    deleteConfig(activeConfigId);
  }, [activeConfigId, deleteConfig]);
}
