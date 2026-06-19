import localforage from "localforage";
import { CloudAlertIcon, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import { usePersistenceStatus } from "@/core/StateProvider/persistence/usePersistenceStatus";

/**
 * A persistent, Google-Docs-style indicator of whether the app's data is safely
 * written to IndexedDB. Quiet while idle; shows progress while saving; raises a
 * standing warning when a write has failed.
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
      action: {
        label: "Back up",
        onClick: () => void saveLocalForageToFile(localforage),
      },
    });
  }, [isOutOfStorage]);

  if (status === "idle") {
    return null;
  }

  if (status === "saving") {
    return (
      <div
        role="status"
        className="text-text-secondary flex items-center gap-2"
      >
        <Loader2Icon className="size-4 animate-spin" />
        Saving…
      </div>
    );
  }

  return (
    <div role="status" className="text-error-main flex items-center gap-2">
      <CloudAlertIcon className="size-4" />
      Couldn&apos;t save your changes
    </div>
  );
}
