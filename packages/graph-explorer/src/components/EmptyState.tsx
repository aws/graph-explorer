import { cva, type VariantProps } from "cva";
import React from "react";

import { cn } from "@/utils";

function EmptyState({
  className,
  size = "default",
  ...props
}: React.ComponentPropsWithRef<"div"> & { size?: "default" | "small" }) {
  return (
    <div
      data-slot="empty"
      data-size={size}
      className={cn(
        "group/empty flex h-full w-full flex-col items-center justify-center",
        className,
      )}
      {...props}
    />
  );
}
EmptyState.displayName = "EmptyState";

const emptyStateIconStyles = cva({
  base: "mb-6 flex size-24 items-center justify-center rounded-full text-7xl text-white group-data-[size=small]/empty:mb-3 group-data-[size=small]/empty:size-10 [&>svg]:size-1/2",
  variants: {
    variant: {
      info: "from-primary to-brand-300 bg-linear-to-b shadow-[0_0_20px_2px_hsl(205,95%,71%,70%)]",
      error:
        "from-danger bg-linear-to-b to-red-300 shadow-[0_0_20px_2px_rgba(255,144,119,0.7)]",
      subtle: "bg-muted text-muted-foreground rounded-lg",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});
function EmptyStateIcon({
  variant,
  className,
  ...props
}: React.ComponentPropsWithRef<"div"> &
  VariantProps<typeof emptyStateIconStyles>) {
  return (
    <div
      className={cn(emptyStateIconStyles({ variant }), className)}
      {...props}
    />
  );
}
EmptyStateIcon.displayName = "EmptyStateIcon";

function EmptyStateContent({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "max-w-paragraph flex w-full flex-col items-center justify-center gap-1 text-center",
        className,
      )}
      {...props}
    />
  );
}
EmptyStateContent.displayName = "EmptyStateContent";

function EmptyStateTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithRef<"h3">) {
  return (
    <h3
      className={cn(
        "text-foreground gx-wrap-break-word text-lg font-semibold text-balance group-data-[size=small]/empty:text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
EmptyStateTitle.displayName = "EmptyStateTitle";

function EmptyStateDescription({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-foreground/75 gx-wrap-break-word text-base font-normal group-data-[size=small]/empty:text-sm",
        className,
      )}
      {...props}
    />
  );
}
EmptyStateDescription.displayName = "EmptyStateDescription";

function EmptyStateActions({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 pt-6",
        className,
      )}
      {...props}
    />
  );
}
EmptyStateActions.displayName = "EmptyStateActions";

export {
  EmptyState,
  EmptyStateIcon,
  EmptyStateContent,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
};
