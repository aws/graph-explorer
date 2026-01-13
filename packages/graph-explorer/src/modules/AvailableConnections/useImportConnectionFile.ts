import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  activeConfigurationAtom,
  configurationAtom,
  createNewConfigurationId,
  schemaAtom,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { fromFileToJson } from "@/utils/fileData";
import isValidConfigurationFile from "@/utils/isValidConfigurationFile";

export function useImportConnectionFile() {
  const resetState = useResetState();
  return useAtomCallback(
    useCallback(
      async (_get, set, file: File) => {
        const fileContent = await fromFileToJson(file);

        if (!isValidConfigurationFile(fileContent)) {
          toast.error("Invalid File", {
            description: "The connection file is not valid",
          });
          return;
        }

        // Create new id to avoid collisions
        const newId = createNewConfigurationId();
        set(configurationAtom, prevConfig => {
          const updatedConfig = new Map(prevConfig);
          updatedConfig.set(newId, {
            id: newId,
            displayLabel: fileContent.displayLabel,
            connection: fileContent.connection,
          });
          return updatedConfig;
        });
        set(schemaAtom, prevSchema => {
          const updatedSchema = new Map(prevSchema);
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
      },
      [resetState],
    ),
  );
}
