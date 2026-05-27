import { useSetAtom } from "jotai";
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

  return async function importStylingFile(file: File) {
    try {
      const fileContent = await fromFileToJson(file);
      const parsed = parseDefaultStyling(fileContent);

      if (!parsed) {
        toast.error("Invalid File", {
          description: "The styling file is not valid",
        });
        return;
      }

      const resolved = resolveDefaultStyling(parsed);

      // Update the reset reference so per-type "Reset to Default" and
      // "Reset all styling" restore the imported values.
      setDefaultStyling(resolved);

      // Replace user styling with the imported values — an explicit import
      // is meant to override existing styling.
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
  };
}
