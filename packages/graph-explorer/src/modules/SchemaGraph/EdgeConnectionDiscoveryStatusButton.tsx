import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import {
  Button,
  ErrorDetailsButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";
import { useMaybeActiveSchema } from "@/core";
import { useTranslations } from "@/hooks";
import { useSchemaSync } from "@/hooks/useSchemaSync";
import { createDisplayError } from "@/utils/createDisplayError";

import { edgeConnectionNotice } from "./edgeConnectionNotice";

/**
 * Toolbar button that surfaces edge connection discovery failures, or an
 * incomplete discovery, in a popover without blocking the rest of the Schema
 * view: node types still render. Renders nothing once discovery has data.
 */
export function EdgeConnectionDiscoveryStatusButton() {
  const schema = useMaybeActiveSchema();
  const { edgeDiscoveryQuery } = useSchemaSync();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  if (!schema) {
    return null;
  }

  const notice = edgeConnectionNotice(schema, edgeDiscoveryQuery.error);
  if (notice === null) {
    return null;
  }

  const retry = () => {
    edgeDiscoveryQuery.refetch();
    setOpen(false);
  };

  if (notice.kind === "not-discovered") {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-warning hover:bg-warning-subtle data-open:bg-warning-subtle"
            aria-label={`${t("edge-connections")} not discovered`}
          >
            <TriangleAlertIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-80">
          <div className="flex flex-col gap-2">
            <p className="font-medium">
              {t("edge-connections")} not discovered
            </p>
            <p className="text-muted-foreground text-sm">
              Node types are shown without the connections between them.
            </p>
            <div className="flex gap-2">
              <Button
                size="small"
                onClick={retry}
                className="shrink-0 whitespace-nowrap"
              >
                Synchronize
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const displayError = notice.error ? createDisplayError(notice.error) : null;
  const title = displayError
    ? displayError.title
    : `Could not discover ${t("edge-connections")}`;
  const message = displayError
    ? displayError.message
    : "The last attempt failed. Retry to try again and see why.";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="danger-ghost"
          size="icon"
          aria-label={`${t("edge-connections")} discovery failed`}
        >
          <TriangleAlertIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80">
        <div className="flex flex-col gap-2">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-sm">{message}</p>
          <div className="flex gap-2">
            {notice.error ? (
              <ErrorDetailsButton error={notice.error} size="small" />
            ) : null}
            <Button
              size="small"
              onClick={retry}
              className="shrink-0 whitespace-nowrap"
            >
              <RotateCcwIcon />
              Retry
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
