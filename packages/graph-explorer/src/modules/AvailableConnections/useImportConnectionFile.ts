import { useAtomCallback } from "jotai/utils";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  activeConfigurationAtom,
  configurationAtom,
  createNewConfigurationId,
  schemaAtom,
} from "@/core";
import { migrateLegacyConnection } from "@/core/StateProvider/configuration";
import useResetState from "@/core/StateProvider/useResetState";
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

        // Fold any legacy `url`/`proxyConnection` from files exported before the
        // unified-proxy model into the canonical `graphDbUrl` shape.
        const connection = migrateLegacyConnection(parsedFile.connection);

        // Create new id to avoid collisions
        const newId = createNewConfigurationId();
        set(configurationAtom, prevConfig => {
          const updatedConfig = new Map(prevConfig);
          updatedConfig.set(newId, {
            id: newId,
            displayLabel: parsedFile.displayLabel,
            connection,
          });
          return updatedConfig;
        });
        set(schemaAtom, prevSchema => {
          const updatedSchema = new Map(prevSchema);
          updatedSchema.set(newId, parsedFile.schema);
          return updatedSchema;
        });
        set(activeConfigurationAtom, newId);

        resetState();
      },
      [resetState],
    ),
  );
}
