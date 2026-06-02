import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  parseDefaultStyling,
  resolveDefaultStyling,
} from "@/core/defaultStyling";
import { defaultStylingAtom, userStylingAtom } from "@/core/StateProvider";
import { logger } from "@/utils";
import { fromFileToJson } from "@/utils/fileData";

export function useImportStylingFile() {
  const setUserStyling = useSetAtom(userStylingAtom);
  const setDefaultStyling = useSetAtom(defaultStylingAtom);

  return useCallback(
    async (file: File) => {
      try {
        const fileContent = await fromFileToJson(file);
        const parsed = parseDefaultStyling(fileContent);

        if (!parsed) {
          toast.error("Invalid File", {
            description: "The styling file is not valid",
          });
          return;
        }

        const resolved = await resolveDefaultStyling(parsed);

        // Update the reset reference so "Reset to Default" uses the
        // imported values
        setDefaultStyling(resolved);

        // Replace user styling with the imported values — an explicit import
        // should override existing styling
        setUserStyling(resolved);

        toast.success("Styling Imported", {
          description: "Styling has been applied successfully",
        });
      } catch (error) {
        logger.warn("Failed to import styling file", error);
        toast.error("Import Failed", {
          description: "Could not read the styling file",
        });
      }
    },
    [setUserStyling, setDefaultStyling],
  );
}
