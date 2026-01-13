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
  error: Error;
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

function ErrorDetailsButton({ error }: { error: Error }) {
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
              {error.name}
            </div>
          </FormItem>
          <FormItem>
            <Label>Error message</Label>
            <div className="gx-wrap-break-word text-base leading-snug">
              {error.message}
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
