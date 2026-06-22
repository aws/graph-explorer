import localforage from "localforage";
import { InfoIcon, SaveAllIcon } from "lucide-react";

import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import { usePersistenceStatus } from "@/core/StateProvider/persistence/usePersistenceStatus";

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
 * "Changes not saved" button that opens a detail dialog.
 *
 * The dialog is the single recovery surface: it shows the raw failure records
 * and always offers to save the configuration to a file, so the user can
 * preserve whatever did persist regardless of why the write failed.
 */
export function PersistenceStatusIndicator() {
  const { status, failures } = usePersistenceStatus();

  if (status !== "failed") {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger" className="rounded-full">
          Changes not saved
          <InfoIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Couldn&apos;t save your changes</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-text-secondary text-sm leading-snug">
            Graph Explorer couldn&apos;t save some changes to browser storage.
            Save your configuration to a file so you don&apos;t lose your work,
            then reload the page.
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
          <Button
            variant="primary"
            onClick={() => void saveLocalForageToFile(localforage)}
          >
            <SaveAllIcon />
            Save Configuration
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
