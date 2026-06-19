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
import { logAndIgnore } from "@/utils";
import { fromFileToJson } from "@/utils/fileData";
import { parseConnectionFile } from "@/utils/parseConnectionFile";

export function useImportConnectionFile() {
  const resetState = useResetState();
  return useAtomCallback(
    useCallback(
      async (_get, set, file: File) => {
        const fileContent = await fromFileToJson(file);
        const parsedFile = parseConnectionFile(fileContent);

        if (!parsedFile) {
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
            displayLabel: parsedFile.displayLabel,
            connection: parsedFile.connection,
          });
          return updatedConfig;
        }).catch(logAndIgnore);
        set(schemaAtom, prevSchema => {
          const updatedSchema = new Map(prevSchema);
          updatedSchema.set(newId, parsedFile.schema);
          return updatedSchema;
        }).catch(logAndIgnore);
        set(activeConfigurationAtom, newId).catch(logAndIgnore);

        resetState();
      },
      [resetState],
    ),
  );
}
