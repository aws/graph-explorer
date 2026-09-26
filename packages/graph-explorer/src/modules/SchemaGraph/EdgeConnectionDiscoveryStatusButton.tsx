import type { ComponentType, ReactNode } from "react";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import type { EdgeConnectionNotice } from "@/hooks/edgeConnectionNotice";

import {
  Button,
  ErrorDetailsButton,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components";
import { EdgeConnectionDiscoveryError } from "@/connector/gremlin/fetchEdgeConnections/discoveryError";
import { useEdgeConnectionNotice } from "@/hooks/useEdgeConnectionNotice";
import useTranslations from "@/hooks/useTranslations";
import { createDisplayError } from "@/utils/createDisplayError";

/** What the popover shows for a resolved, non-null edge connection notice. */
type NoticeView = {
  variant: "warning-ghost" | "danger-ghost";
  /** Accessible name for the trigger, reused as its tooltip text. */
  triggerLabel: string;
  title: string;
  description: ReactNode;
  error: Error | null;
  actionLabel: string;
  actionIcon: ComponentType | null;
};

function toNoticeView(
  notice: Exclude<EdgeConnectionNotice, null>,
  t: ReturnType<typeof useTranslations>,
): NoticeView {
  const edgeConnections = t("edge-connections");

  if (notice.kind === "not-discovered") {
    return {
      variant: "warning-ghost",
      triggerLabel: `${edgeConnections} not discovered`,
      title: `${edgeConnections} not discovered`,
      description: (
        <span>Node types are shown without the connections between them.</span>
      ),
      error: null,
      actionLabel: "Synchronize",
      actionIcon: null,
    };
  }

  const failure = describeFailure(notice.error);

  return {
    variant: "danger-ghost",
    triggerLabel: `${edgeConnections} discovery failed`,
    title: `Could not discover ${edgeConnections}`,
    description: (
      <>
        {failure.lead ? (
          <span className="text-foreground block font-medium">
            {failure.lead}
          </span>
        ) : null}
        <span className="block">{failure.message}</span>
        {failure.nextStep ? (
          <span className="mt-1 block">{failure.nextStep}</span>
        ) : null}
      </>
    ),
    error: notice.error,
    actionLabel: "Retry",
    actionIcon: RotateCcwIcon,
  };
}

/** The failed popover's description: what happened, then what to do next. */
type FailureDescription = {
  /** A short name for the error, shown only when the title doesn't say it. */
  lead: string | null;
  message: string;
  nextStep: string | null;
};

function describeFailure(error: Error | null): FailureDescription {
  // After a reload only the persisted flag survives, not the error.
  if (error == null) {
    return {
      lead: null,
      message: "The last attempt failed.",
      nextStep: "Node types are still shown. Retry to see why.",
    };
  }

  const displayError = createDisplayError(error);

  // Its title restates the popover's, and its message already ends with what
  // to change and that node types are still shown.
  if (error instanceof EdgeConnectionDiscoveryError) {
    return { lead: null, message: displayError.message, nextStep: null };
  }

  return {
    lead: displayError.title,
    message: displayError.message,
    nextStep:
      "Node types are still shown. Retry, or open Error Details to see the full error.",
  };
}

/**
 * Toolbar button that surfaces edge connection discovery failures, or an
 * incomplete discovery, in a popover without blocking the rest of the Schema
 * view: node types still render. Renders nothing once discovery has data.
 */
export function EdgeConnectionDiscoveryStatusButton() {
  const { notice, edgeDiscoveryQuery } = useEdgeConnectionNotice();
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  if (notice === null) {
    return null;
  }

  const view = toNoticeView(notice, t);
  const ActionIcon = view.actionIcon;

  const runAction = () => {
    edgeDiscoveryQuery.refetch();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={view.variant}
          size="icon-small"
          tooltip={view.triggerLabel}
        >
          <TriangleAlertIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{view.title}</PopoverTitle>
          <PopoverDescription>{view.description}</PopoverDescription>
        </PopoverHeader>
        <PopoverFooter>
          {view.error ? (
            <ErrorDetailsButton error={view.error} size="small" />
          ) : null}
          <Button
            size="small"
            onClick={runAction}
            className="shrink-0 whitespace-nowrap"
          >
            {ActionIcon ? <ActionIcon /> : null}
            {view.actionLabel}
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
