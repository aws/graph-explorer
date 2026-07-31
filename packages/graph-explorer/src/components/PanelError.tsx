import { InfoIcon, RotateCcwIcon } from "lucide-react";

import { createDisplayError } from "@/utils/createDisplayError";
import { createErrorDetails } from "@/utils/createErrorDetails";

import { Button } from "./Button";
import { CodeEditor } from "./CodeEditor";
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
            <Button onClick={onRetry}>
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
  const {
    name: errorName,
    message: errorMessage,
    data: errorData,
  } = createErrorDetails(error);
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
          {errorMessage ? (
            <FormItem>
              <Label>Error message</Label>
              <div className="gx-wrap-break-word text-base leading-snug">
                {errorMessage}
              </div>
            </FormItem>
          ) : null}
          {errorData ? (
            <FormItem>
              <Label>Error data</Label>
              <div className="bg-background-alt grid min-h-64 overflow-auto rounded-lg border shadow-xs">
                <CodeEditor
                  defaultLanguage="json"
                  value={errorData}
                  options={{
                    readOnly: true,
                    ariaLabel: "Raw error details",
                    // Matches current tailwind padding of 2 or 0.5rem
                    padding: { top: 7, bottom: 7 },
                  }}
                  wrapperProps={{ className: "pl-2" }}
                />
              </div>
            </FormItem>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="primary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
