import { useAtomValue } from "jotai";
import { toast } from "sonner";

import { userStylingToExportFormat } from "@/core/defaultStyling";
import { userStylingAtom } from "@/core/StateProvider";
import { logger } from "@/utils";
import { saveFile, toJsonFileData } from "@/utils/fileData";

export function useExportStylingFile() {
  const userStyling = useAtomValue(userStylingAtom);

  return async function exportStylingFile() {
    try {
      const exportData = userStylingToExportFormat(userStyling);
      const blob = toJsonFileData(exportData, 2);
      await saveFile(blob, "graph-explorer-styling.json");
    } catch (error) {
      logger.warn("Failed to export styling file", error);
      toast.error("Export Failed", {
        description: "Could not save the styling file",
      });
    }
  };
}
