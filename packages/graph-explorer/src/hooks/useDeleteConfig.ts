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
    useCallback(async (_get, set, id: ConfigurationId) => {
      logger.log("Deleting connection:", id);
      await set(activeConfigurationAtom, async prev => {
        const prevValue = await prev;
        if (prevValue === id) {
          return null;
        }
        return prevValue;
      });

      await set(configurationAtom, async prevConfigs => {
        const updatedConfigs = new Map(await prevConfigs);
        updatedConfigs.delete(id);
        return updatedConfigs;
      });

      await set(schemaAtom, async prevSchemas => {
        const updatedSchemas = new Map(await prevSchemas);
        updatedSchemas.delete(id);
        return updatedSchemas;
      });

      await set(allGraphSessionsAtom, async prev => {
        const updatedGraphs = new Map(await prev);
        updatedGraphs.delete(id);
        return updatedGraphs;
      });
    }, [])
  );
}

export function useDeleteActiveConfiguration() {
  const activeConfigId = useAtomValue(activeConfigurationAtom);
  const deleteConfig = useDeleteConfig();

  return async () => {
    if (!activeConfigId) {
      return;
    }

    await deleteConfig(activeConfigId);
  };
}
