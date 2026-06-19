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
 * Toasts are reserved for the one terminal failure a user can act on: running
 * out of storage, where the recovery is to back up their data to a file.
 */
export function SaveStatusIndicator() {
  const { status, failures } = usePersistenceStatus();

  const isOutOfStorage = failures.some(
    failure => failure.reason === "terminal-quota",
  );

  useEffect(() => {
    if (!isOutOfStorage) {
      return;
    }
    toast.error("Out of storage", {
      description:
        "Some changes couldn't be saved. Back up your data to a file so you don't lose it.",
      // Data loss is at stake, so this stays until the user acts on or dismisses
      // it rather than disappearing on the Toaster's default timeout.
      duration: Infinity,
      action: {
        label: "Back up",
        onClick: () => void saveLocalForageToFile(localforage),
      },
    });
  }, [isOutOfStorage]);

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
