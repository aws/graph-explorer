import localforage from "localforage";
import { CircleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Alert, AlertTitle } from "@/components/Alert";
import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import { usePersistenceStatus } from "@/core/StateProvider/persistence/usePersistenceStatus";

/**
 * A standing warning that the app failed to write data to IndexedDB. Renders
 * nothing while idle or saving — only a terminal failure surfaces.
 *
 * Toasts are reserved for terminal failures and their wording depends on the
 * reason. When storage is full a backup is offered, because IndexedDB can still
 * be read to capture everything that did persist. When storage is inaccessible
 * (private mode, blocked by policy) no backup is offered: the database never
 * opened, so there is nothing to read.
 */
export function SaveStatusIndicator() {
  const { status, failures } = usePersistenceStatus();

  const isOutOfStorage = failures.some(
    failure => failure.reason === "terminal-quota",
  );
  const isStorageInaccessible = failures.some(
    failure => failure.reason === "terminal-access",
  );

  useEffect(() => {
    if (!isOutOfStorage) {
      return;
    }
    toast.error("Browser storage is full", {
      description:
        "Graph Explorer has run out of space to save changes in this browser. Download a backup so you don't lose your work.",
      // Data loss is at stake, so this stays until the user acts on or dismisses
      // it rather than disappearing on the Toaster's default timeout.
      duration: Infinity,
      action: {
        label: "Download backup",
        onClick: () => void saveLocalForageToFile(localforage),
      },
    });
  }, [isOutOfStorage]);

  useEffect(() => {
    if (!isStorageInaccessible) {
      return;
    }
    toast.error("Can't save to browser storage", {
      description:
        "Graph Explorer can't access browser storage, so your changes won't be saved this session. This often happens in private browsing or when storage is blocked.",
      duration: Infinity,
    });
  }, [isStorageInaccessible]);

  if (status !== "failed") {
    return null;
  }

  return (
    <Alert variant="danger" className="w-auto">
      <CircleAlertIcon />
      <AlertTitle>Couldn&apos;t save your changes</AlertTitle>
    </Alert>
  );
}
