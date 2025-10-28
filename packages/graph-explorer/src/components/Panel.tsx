import { cn } from "@/utils";
import React from "react";

import { IconButton, type IconButtonProps } from "@/components/IconButton";
import { XIcon } from "lucide-react";

interface PanelProps extends React.ComponentPropsWithoutRef<"div"> {
  variant?: "default" | "sidebar";
}

const Panel = React.forwardRef<React.ElementRef<"div">, PanelProps>(
  ({ variant = "default", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-background-default @container/panel flex h-full flex-col overflow-hidden",
        variant === "default" && "shadow-primary-dark/20 rounded-lg shadow",
        className
      )}
      {...props}
    />
  )
);
Panel.displayName = "Panel";

const PanelContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-background-default flex h-full w-full grow flex-col overflow-y-auto",
      className
    )}
    {...props}
  />
));
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

const PanelHeader = React.forwardRef<
  React.ElementRef<"div">,
  React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-background-default flex min-h-[48px] w-full shrink-0 items-center gap-4 overflow-x-auto border-b px-3 py-1",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
PanelHeader.displayName = "PanelHeader";

const PanelFooter = React.forwardRef<
  React.ElementRef<"div">,
  React.PropsWithChildren<React.ComponentPropsWithoutRef<"div">>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-background-default w-full border-t px-3 py-3", className)}
    {...props}
  >
    {children}
  </div>
));
PanelFooter.displayName = "PanelFooter";

const PanelTitle = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-text-primary inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-base font-bold leading-none",
      className
    )}
    {...props}
  />
));
PanelTitle.displayName = "PanelTitle";

const PanelHeaderDivider = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-divider mx-1 h-5 w-[1px]", className)}
    {...props}
  />
));
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

export const PanelHeaderActionButton = React.forwardRef<
  HTMLButtonElement,
  Action & IconButtonProps
>(({ label, active, onActionClick, ...props }, ref) => (
  <IconButton
    ref={ref}
    tooltipText={label}
    variant={active ? "filled" : "text"}
    {...(onActionClick && { onClick: onActionClick })}
    {...props}
  />
));
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
