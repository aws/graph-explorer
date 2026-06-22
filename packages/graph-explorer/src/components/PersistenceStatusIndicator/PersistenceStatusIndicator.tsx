import localforage from "localforage";
import { CircleAlertIcon, InfoIcon } from "lucide-react";

import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import { usePersistenceStatus } from "@/core/StateProvider/persistence/usePersistenceStatus";

import { Alert, AlertTitle } from "../Alert";
import { Button } from "../Button";
import { CodeEditor } from "../CodeEditor";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../Dialog";
import { FormItem } from "../Form";
import { Label } from "../Label";

/**
 * A standing warning that the app failed to write data to IndexedDB. Renders
 * nothing while idle or saving — only a terminal failure surfaces, as a danger
 * Alert with a "Details" button that opens a detail dialog.
 *
 * The dialog is the single recovery surface: it shows the raw failure records
 * and offers a backup download when (and only when) storage is full — IndexedDB
 * is still readable then, so a backup can capture everything that did persist.
 * When storage is inaccessible (private mode, blocked) no backup is offered: the
 * database never opened, so there is nothing to read.
 */
export function PersistenceStatusIndicator() {
  const { status, failures } = usePersistenceStatus();

  if (status !== "failed") {
    return null;
  }

  const canBackUp = failures.some(
    failure => failure.reason === "terminal-quota",
  );

  return (
    <Alert variant="danger" className="w-auto">
      <CircleAlertIcon />
      <AlertTitle>Couldn&apos;t save your changes</AlertTitle>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="danger-ghost" size="small">
            <InfoIcon />
            Details
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Couldn&apos;t save your changes</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-text-secondary text-sm leading-snug">
              {canBackUp
                ? "Your browser is out of storage. Download a backup so you don't lose your work, then free up space and reload."
                : "Graph Explorer can't access browser storage, so these changes won't be saved this session. This often happens in private browsing or when storage is blocked."}
            </p>
            <FormItem>
              <Label>Failed writes</Label>
              <div className="grid min-h-64 overflow-auto rounded-lg border bg-gray-50 shadow-xs">
                <CodeEditor
                  defaultLanguage="json"
                  value={JSON.stringify(failures, null, 2)}
                  options={{
                    readOnly: true,
                    ariaLabel: "Persistence failure details",
                    // Matches current tailwind padding of 2 or 0.5rem
                    padding: { top: 7, bottom: 7 },
                  }}
                  wrapperProps={{ className: "pl-2" }}
                />
              </div>
            </FormItem>
          </DialogBody>
          <DialogFooter>
            {canBackUp ? (
              <Button
                variant="primary"
                onClick={() => void saveLocalForageToFile(localforage)}
              >
                Download Backup
              </Button>
            ) : null}
            <DialogClose asChild>
              <Button variant={canBackUp ? "secondary" : "primary"}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Alert>
  );
}
