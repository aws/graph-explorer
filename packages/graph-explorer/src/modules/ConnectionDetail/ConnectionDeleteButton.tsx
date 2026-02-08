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
  saveCopy: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const saveAndDelete = () => {
    saveCopy();
    deleteActiveConfig();
  };

  return (
    <>
      <Button
        title="Delete connection"
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
                <ErrorIcon className="text-warning-main size-16" />
              </div>
              <Paragraph>
                Are you sure you want to delete the connection,{" "}
                <strong className="font-bold">{connectionName}</strong>? This
                cannot be undone.
              </Paragraph>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={saveAndDelete}>Save a Copy & Delete</Button>
            <Button onClick={deleteActiveConfig} variant="danger">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
