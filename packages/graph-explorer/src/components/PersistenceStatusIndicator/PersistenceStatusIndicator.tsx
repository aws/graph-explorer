import localforage from "localforage";
import { CircleAlertIcon } from "lucide-react";

import type { PersistenceFailure } from "@/core/StateProvider/persistence";

import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import { usePersistenceStatus } from "@/core/StateProvider/persistence/usePersistenceStatus";

import { Alert, AlertTitle } from "../Alert";
import { Button } from "../Button";
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
 * Friendly, engine-neutral names for the storage keys. The store reports raw
 * keys; humanizing them lives here at the React edge so the storage layer stays
 * free of UI vocabulary.
 */
const STORAGE_KEY_LABELS: Record<string, string> = {
  configuration: "Connections",
  "active-configuration": "Connections",
  schema: "Schema",
  "user-styling": "Style preferences",
  "user-layout": "Layout preferences",
  "graph-sessions": "Exploration sessions",
};

function labelForKey(key: string) {
  return STORAGE_KEY_LABELS[key] ?? key;
}

function describeReason(failure: PersistenceFailure) {
  switch (failure.reason) {
    case "terminal-quota":
      return "Browser storage is full";
    case "terminal-access":
      return "Can't access browser storage";
    case "retryable":
      return "Couldn't be saved";
  }
}

/**
 * A standing warning that the app failed to write data to IndexedDB. Renders
 * nothing while idle or saving — only a terminal failure surfaces, as a danger
 * Alert that opens a detail dialog.
 *
 * The dialog is the single recovery surface: it lists what failed and why, and
 * offers a backup download when (and only when) storage is full — IndexedDB is
 * still readable then, so a backup can capture everything that did persist. When
 * storage is inaccessible (private mode, blocked) no backup is offered: the
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
    <Dialog>
      <DialogTrigger asChild>
        <Alert
          variant="danger"
          className="hover:bg-danger-subtle/70 w-auto cursor-pointer"
        >
          <CircleAlertIcon />
          <AlertTitle>Couldn&apos;t save your changes</AlertTitle>
        </Alert>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Couldn&apos;t save your changes</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {canBackUp ? (
            <p className="text-text-secondary text-sm leading-snug">
              Your browser is out of storage. Download a backup so you
              don&apos;t lose your work, then free up space and reload.
            </p>
          ) : (
            <p className="text-text-secondary text-sm leading-snug">
              Graph Explorer can&apos;t access browser storage, so these changes
              won&apos;t be saved this session. This often happens in private
              browsing or when storage is blocked.
            </p>
          )}
          {failures.map(failure => (
            <FormItem key={failure.key}>
              <Label>{labelForKey(failure.key)}</Label>
              <div className="text-text-secondary text-sm leading-snug">
                {describeReason(failure)}
              </div>
            </FormItem>
          ))}
        </DialogBody>
        <DialogFooter>
          {canBackUp ? (
            <Button
              variant="primary"
              onClick={() => void saveLocalForageToFile(localforage)}
            >
              Download backup
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button variant={canBackUp ? "secondary" : "primary"}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
