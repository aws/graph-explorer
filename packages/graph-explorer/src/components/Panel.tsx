import { XIcon } from "lucide-react";
import React from "react";

import { IconButton, type IconButtonProps } from "@/components/IconButton";
import { cn } from "@/utils";

interface PanelProps extends React.ComponentPropsWithRef<"div"> {
  variant?: "default" | "sidebar";
}

export function PanelGroup({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="panel-group"
      className={cn(
        "bg-brand-100 flex min-h-0 min-w-0 flex-1 gap-2 p-2",
        className,
      )}
      {...props}
    />
  );
}

function Panel({ variant = "default", className, ...props }: PanelProps) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "bg-background-default flex h-full flex-col overflow-hidden",
        variant === "default" &&
          "shadow-primary-foreground/25 rounded-lg shadow",
        className,
      )}
      {...props}
    />
  );
}
Panel.displayName = "Panel";

function PanelContent({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "bg-background-default flex h-full w-full grow flex-col overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}
PanelContent.displayName = "PanelContent";

export type Action = {
  label: string;
  keepOpenOnSelect?: boolean;
  alwaysVisible?: boolean;
  active?: boolean;
  onlyPinnedVisible?: boolean;
  collapsedItems?: React.ReactElement<any>;
};

function PanelHeader({
  className,
  children,
  ...props
}: React.PropsWithChildren<React.ComponentPropsWithRef<"div">>) {
  return (
    <div
      className={cn(
        "bg-background-default flex min-h-[48px] w-full shrink-0 items-center gap-4 overflow-x-auto border-b px-3 py-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
PanelHeader.displayName = "PanelHeader";

function PanelFooter({
  className,
  children,
  ...props
}: React.PropsWithChildren<React.ComponentPropsWithRef<"div">>) {
  return (
    <div
      className={cn(
        "bg-background-default w-full border-t px-3 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
PanelFooter.displayName = "PanelFooter";

function PanelTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-text-primary inline-flex shrink-0 items-center gap-2 text-base leading-none font-bold whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
PanelTitle.displayName = "PanelTitle";

function PanelHeaderDivider({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div className={cn("bg-border mx-1 h-5 w-px", className)} {...props} />
  );
}
PanelHeaderDivider.displayName = "PanelHeaderDivider";

export interface PanelHeaderCloseButtonProps extends React.PropsWithChildren<
  React.ComponentPropsWithoutRef<"div">
> {
  onClose: () => void;
}

export function PanelHeaderCloseButton({
  onClose,
}: PanelHeaderCloseButtonProps) {
  return (
    <IconButton
      tooltipText="Close"
      onClick={onClose}
      variant="text"
      size="small"
    >
      <XIcon />
    </IconButton>
  );
}
PanelHeaderCloseButton.displayName = "PanelHeaderCloseButton";

export function PanelHeaderActionButton({
  label,
  active,
  ...props
}: Action & IconButtonProps) {
  return (
    <IconButton
      tooltipText={label}
      variant={active ? "filled" : "text"}
      {...props}
    />
  );
}
PanelHeaderActionButton.displayName = "PanelHeaderActionButton";

export type PanelHeaderActionsProps = React.PropsWithChildren<
  React.ComponentPropsWithoutRef<"div">
>;

function PanelHeaderActions({
  children,
  className,
  ...props
}: PanelHeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex grow flex-row items-center justify-end gap-0.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

PanelHeaderActions.displayName = "PanelHeaderActions";

export {
  Panel,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelHeaderActions,
  PanelTitle,
  PanelHeaderDivider,
};
