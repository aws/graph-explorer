import { InfoIcon, RotateCcwIcon } from "lucide-react";

import { createDisplayError } from "@/utils/createDisplayError";

import { Button } from "./Button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "./EmptyState";
import { FormItem } from "./Form";
import { GraphIcon } from "./icons";
import { Label } from "./Label";

export default function PanelError({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string | undefined;
}) {
  const displayError = createDisplayError(error);
  return (
    <EmptyState className={className}>
      <EmptyStateIcon variant="error">
        <GraphIcon />
      </EmptyStateIcon>
      <EmptyStateContent>
        <EmptyStateTitle>{displayError.title}</EmptyStateTitle>
        <EmptyStateDescription>{displayError.message}</EmptyStateDescription>

        <EmptyStateActions>
          <ErrorDetailsButton error={error} />
          {onRetry ? (
            <Button onPress={onRetry}>
              <RotateCcwIcon />
              Retry
            </Button>
          ) : null}
        </EmptyStateActions>
      </EmptyStateContent>
    </EmptyState>
  );
}

function ErrorDetailsButton({ error }: { error: unknown }) {
  const errorName = Error.isError(error) ? error.name : "Unknown Error";
  const errorMessage = Error.isError(error)
    ? error.message
    : JSON.stringify(error, null, 2);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <InfoIcon />
          Error Details
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error Details</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <FormItem>
            <Label>Error name</Label>
            <div className="gx-wrap-break-word text-base leading-snug">
              {errorName}
            </div>
          </FormItem>
          <FormItem>
            <Label>Error message</Label>
            <div className="gx-wrap-break-word text-base leading-snug">
              {errorMessage}
            </div>
          </FormItem>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="filled">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
