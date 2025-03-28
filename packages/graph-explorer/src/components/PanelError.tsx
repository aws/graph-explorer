import { createDisplayError } from "@/utils/createDisplayError";
import { GraphIcon } from "./icons";
import { Button } from "./Button";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateContent,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
} from "./EmptyState";
import { InfoIcon, RotateCcwIcon } from "lucide-react";
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
import { Label } from "./Label";
import { FormItem } from "./Form";

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
            <div className="text-pretty text-base leading-snug [word-break:break-word]">
              {error.name}
            </div>
          </FormItem>
          <FormItem>
            <Label>Error message</Label>
            <div className="text-pretty text-base leading-snug [word-break:break-word]">
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
