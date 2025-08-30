import {
  DeleteIcon,
  PanelHeaderActionButton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  Paragraph,
  Button,
  TrayArrowIcon,
  ErrorIcon,
} from "@/components";
import { useState } from "react";

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
            <DialogTitle>Delete {connectionName}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-row items-start gap-8">
              <div className="py-1">
                <ErrorIcon className="text-warning-main size-16" />
              </div>
              <div>
                <Paragraph>
                  Are you sure you want to delete this connection?
                </Paragraph>
                <Paragraph>
                  This action is permanent and cannot be undone.
                </Paragraph>
              </div>
            </div>
            <div className="flex w-full justify-between">
              <Button onPress={saveCopy} variant="text">
                <TrayArrowIcon />
                Export Copy
              </Button>
              <div className="flex gap-2 self-end justify-self-end">
                <Button onPress={() => setIsOpen(false)}>Cancel</Button>
                <Button
                  onPress={deleteActiveConfig}
                  color="danger"
                  variant="filled"
                >
                  Delete Connection
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
