import { Button } from "@/components/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/Dialog";

import type { RawConfiguration } from "./ConfigurationProvider";

interface UrlConnectionDialogProps {
  open: boolean;
  connection: RawConfiguration | null;
  isExisting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UrlConnectionDialog({
  open,
  connection,
  isExisting,
  onConfirm,
  onCancel,
}: UrlConnectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isExisting ? "Activate Connection" : "Create Connection"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {connection && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {connection.displayLabel}
              </p>
              <p>
                <span className="font-medium">Endpoint:</span>{" "}
                {connection.connection?.graphDbUrl}
              </p>
              <p>
                <span className="font-medium">Query Engine:</span>{" "}
                {connection.connection?.queryEngine}
              </p>
              {connection.connection?.awsRegion && (
                <p>
                  <span className="font-medium">Region:</span>{" "}
                  {connection.connection.awsRegion}
                </p>
              )}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {isExisting ? "Connect" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
