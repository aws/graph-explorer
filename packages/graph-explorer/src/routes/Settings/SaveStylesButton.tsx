import { DownloadIcon, TriangleAlertIcon } from "lucide-react";
import { startTransition, useActionState } from "react";

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
import { isCancellationError, logger } from "@/utils";
import {
  createDisplayError,
  type DisplayError,
} from "@/utils/createDisplayError";
import { saveFile, toJsonFileData } from "@/utils/fileData";

/**
 * What the save dialog is showing. `closed` is the resting state — the dialog is
 * hidden, which covers both a successful save and a dismissed save picker (a
 * cancel, not a failure). `failed` carries a display-ready error for anything
 * that actually went wrong while writing the file.
 */
type DialogState = { kind: "closed" } | { kind: "failed"; error: DisplayError };

type SaveAction = { type: "save" } | { type: "dismiss" };

export default function SaveStylesButton() {
  const { getExportPayload } = useExportStylingFile();

  // The action is a reducer that awaits the file-save side effect, since it runs
  // as an event rather than as a pure reducer. React tracks `isPending` across
  // the await, so `state` is the single source of truth for what the dialog
  // shows.
  async function runSave(
    _state: DialogState,
    action: SaveAction,
  ): Promise<DialogState> {
    switch (action.type) {
      case "save":
        try {
          const payload = getExportPayload();
          const envelope = createFileEnvelope(
            STYLING_EXPORT_KIND,
            STYLING_EXPORT_VERSION,
            payload,
          );
          await saveFile(
            toJsonFileData(envelope),
            "graph-explorer.styles.json",
            "Graph Explorer styles",
          );
          return { kind: "closed" };
        } catch (error) {
          // Dismissing the save picker is a cancel, not a failure — stay closed.
          if (isCancellationError(error)) {
            return { kind: "closed" };
          }
          logger.error("Save failed", error);
          return { kind: "failed", error: createDisplayError(error) };
        }
      case "dismiss":
        return { kind: "closed" };
    }
  }

  const [state, dispatchAction, isPending] = useActionState(runSave, {
    kind: "closed",
  });

  // The action awaits, so every dispatch must run inside a transition — else
  // React both warns and lets the pending update reveal the nearest Suspense
  // fallback (the whole Settings page). Wrapping here makes every call site
  // transition-safe by construction.
  function dispatch(action: SaveAction) {
    startTransition(() => dispatchAction(action));
  }

  return (
    <>
      <Button
        className="min-w-28"
        onClick={() => dispatch({ type: "save" })}
        disabled={isPending}
      >
        <DownloadIcon />
        Save to File
      </Button>
      <AlertDialog
        open={state.kind !== "closed"}
        onOpenChange={o => !o && dispatch({ type: "dismiss" })}
      >
        {state.kind === "failed" ? (
          <SaveFailedContent error={state.error} />
        ) : null}
      </AlertDialog>
    </>
  );
}

function SaveFailedContent({ error }: { error: DisplayError }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogMedia className="bg-danger-subtle text-danger-foreground">
          <TriangleAlertIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>{error.title}</AlertDialogTitle>
        <AlertDialogDescription>{error.message}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>Close</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
