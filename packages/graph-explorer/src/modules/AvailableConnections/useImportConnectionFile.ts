import { useNotification } from "@/components/NotificationProvider";
import {
  createNewConfigurationId,
  configurationAtom,
  schemaAtom,
  activeConfigurationAtom,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { fromFileToJson } from "@/utils/fileData";
import isValidConfigurationFile from "@/utils/isValidConfigurationFile";
import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

export function useImportConnectionFile() {
  const resetState = useResetState();
  const { enqueueNotification } = useNotification();
  return useAtomCallback(
    useCallback(
      async (_get, set, file: File) => {
        const fileContent = await fromFileToJson(file);

        if (!isValidConfigurationFile(fileContent)) {
          enqueueNotification({
            title: "Invalid File",
            message: "The connection file is not valid",
            type: "error",
            stackable: true,
          });
          return;
        }

        // Create new id to avoid collisions
        const newId = createNewConfigurationId();
        await set(configurationAtom, async prevConfig => {
          const updatedConfig = new Map(await prevConfig);
          updatedConfig.set(newId, {
            id: newId,
            displayLabel: fileContent.displayLabel,
            connection: fileContent.connection,
          });
          return updatedConfig;
        });
        await set(schemaAtom, async prevSchema => {
          const updatedSchema = new Map(await prevSchema);
          updatedSchema.set(newId, {
            vertices: fileContent.schema?.vertices || [],
            edges: fileContent.schema?.edges || [],
            prefixes: fileContent.schema?.prefixes?.map(prefix => ({
              ...prefix,
              __matches: new Set(prefix.__matches || []),
            })),
            lastUpdate: fileContent.schema?.lastUpdate
              ? new Date(fileContent.schema?.lastUpdate)
              : undefined,
          });
          return updatedSchema;
        });
        set(activeConfigurationAtom, newId);

        resetState();
        enqueueNotification({
          title: "File imported",
          message: "Connection file successfully imported",
          type: "success",
          stackable: true,
        });
      },
      [enqueueNotification, resetState]
    )
  );
}
