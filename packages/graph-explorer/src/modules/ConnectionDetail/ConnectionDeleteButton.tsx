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
  PanelHeaderActionButton,
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
      <PanelHeaderActionButton
        label="Delete connection"
        icon={<DeleteIcon />}
        color="danger"
        isDisabled={isSync}
        onActionClick={() => setIsOpen(true)}
      />
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
            <Button onPress={() => setIsOpen(false)}>Cancel</Button>
            <Button onPress={saveAndDelete}>Save a Copy & Delete</Button>
            <Button
              onPress={deleteActiveConfig}
              color="danger"
              variant="filled"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
