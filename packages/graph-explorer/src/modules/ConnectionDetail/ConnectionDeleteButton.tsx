import { useState } from "react";

import {
  Button,
  DeleteIcon,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorIcon,
  Paragraph,
} from "@/components";

export default function ConnectionDeleteButton({
  connectionName,
  isSync,
  deleteActiveConfig,
  saveCopy,
}: {
  connectionName: string;
  isSync: boolean;
  deleteActiveConfig: () => void;
  saveCopy: () => boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const saveAndDelete = () => {
    // Only delete once the backup copy is actually written; a refused export
    // (e.g. a connection with no URL) already surfaced its own error, and
    // deleting anyway would destroy the connection the copy was meant to save.
    if (saveCopy()) {
      deleteActiveConfig();
    }
  };

  return (
    <>
      <Button
        tooltip="Delete connection"
        variant="danger-ghost"
        size="icon"
        disabled={isSync}
        onClick={() => setIsOpen(true)}
      >
        <DeleteIcon />
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription className="sr-only">
              Confirm the deletion of the connection named {connectionName}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-row items-start gap-8">
              <div className="py-1">
                <ErrorIcon className="text-warning size-16" />
              </div>
              <Paragraph>
                Are you sure you want to delete the connection,{" "}
                <strong className="font-semibold">{connectionName}</strong>?
                This cannot be undone.
              </Paragraph>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={saveAndDelete}>
              Save a Copy & Delete
            </Button>
            <Button onClick={deleteActiveConfig} variant="danger">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
