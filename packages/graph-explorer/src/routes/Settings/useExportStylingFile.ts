import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { toast } from "sonner";

import { userStylingToExportFormat } from "@/core/defaultStyling";
import { userStylingAtom } from "@/core/StateProvider";
import { logger } from "@/utils";
import { saveFile, toJsonFileData } from "@/utils/fileData";

export function useExportStylingFile() {
  const userStyling = useAtomValue(userStylingAtom);

  return useCallback(async () => {
    try {
      const exportData = userStylingToExportFormat(userStyling);
      const blob = toJsonFileData(exportData);
      await saveFile(blob, "defaultStyling.json");
    } catch (error) {
      logger.warn("Failed to export styling file", error);
      toast.error("Export Failed", {
        description: "Could not save the styling file",
      });
    }
  }, [userStyling]);
}
