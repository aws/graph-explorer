import { cn } from "@/utils";
import React from "react";

import { IconButton, type IconButtonProps } from "@/components/IconButton";
import { XIcon } from "lucide-react";

interface PanelProps extends React.ComponentPropsWithRef<"div"> {
  variant?: "default" | "sidebar";
}

function Panel({ variant = "default", className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-background-default flex h-full flex-col overflow-hidden",
        variant === "default" && "shadow-primary-dark/20 rounded-lg shadow",
        className
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
        className
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
  onActionClick?: () => void;
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
        className
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
        className
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
        className
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
    <div className={cn("bg-divider mx-1 h-5 w-[1px]", className)} {...props} />
  );
}
PanelHeaderDivider.displayName = "PanelHeaderDivider";

export interface PanelHeaderCloseButtonProps
  extends React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">> {
  onClose: () => void;
}

export function PanelHeaderCloseButton({
  onClose,
}: PanelHeaderCloseButtonProps) {
  return (
    <IconButton
      tooltipText="Close"
      icon={<XIcon />}
      onClick={onClose}
      variant="text"
      size="small"
    />
  );
}
PanelHeaderCloseButton.displayName = "PanelHeaderCloseButton";

export function PanelHeaderActionButton({
  label,
  active,
  onActionClick,
  ...props
}: Action & IconButtonProps) {
  return (
    <IconButton
      tooltipText={label}
      variant={active ? "filled" : "text"}
      {...(onActionClick && { onClick: onActionClick })}
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
        className
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
