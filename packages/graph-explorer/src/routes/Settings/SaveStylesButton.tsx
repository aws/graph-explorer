import { useMutation } from "@tanstack/react-query";
import { DownloadIcon, TriangleAlertIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
} from "@/components";
import { createFileEnvelope } from "@/core/fileEnvelope";
import {
  STYLING_EXPORT_KIND,
  STYLING_EXPORT_VERSION,
  useExportStylingFile,
} from "@/core/styling";
import { logger } from "@/utils";
import { saveFile, toJsonFileData } from "@/utils/fileData";

export default function SaveStylesButton() {
  const { getExportPayload } = useExportStylingFile();

  const saveStyles = useMutation({
    mutationFn: async () => {
      const payload = getExportPayload();
      const envelope = createFileEnvelope(
        STYLING_EXPORT_KIND,
        STYLING_EXPORT_VERSION,
        payload,
      );
      const blob = toJsonFileData(envelope);
      try {
        await saveFile(blob, "graph-explorer-styles.json");
      } catch (e: unknown) {
        // The user dismissing the save picker is a cancel, not a failure.
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        throw e;
      }
    },
    onError: error => logger.warn("Save failed", error),
  });

  return (
    <>
      <Button
        className="min-w-28"
        onClick={() => saveStyles.mutate()}
        disabled={saveStyles.isPending}
      >
        <DownloadIcon />
        Save
      </Button>
      <AlertDialog
        open={saveStyles.isError}
        onOpenChange={o => !o && saveStyles.reset()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-danger-subtle text-danger">
              <TriangleAlertIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Save Failed</AlertDialogTitle>
            <AlertDialogDescription>
              {saveStyles.error?.message ??
                "The styles file could not be saved."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => saveStyles.reset()}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
