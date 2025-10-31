import { cn } from "@/utils";
import { cva, type VariantProps } from "cva";
import React from "react";

function EmptyState({
  className,
  ...props
}: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center",
        className
      )}
      {...props}
    />
  );
}
EmptyState.displayName = "EmptyState";

const emptyStateIconStyles = cva({
  base: "mb-6 flex size-24 items-center justify-center rounded-full text-7xl text-white [&>svg]:size-1/2",
  variants: {
    variant: {
      info: "from-primary-main to-primary-light bg-gradient-to-b shadow-[0_0_20px_2px_hsl(205,95%,71%,70%)]",
      error:
        "from-error-main to-error-light bg-gradient-to-b shadow-[0_0_20px_2px_rgba(255,144,119,0.7)]",
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
        className
      )}
      {...props}
    />
  );
}
EmptyStateContent.displayName = "EmptyStateContent";

function EmptyStateTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<"h1">) {
  return (
    <h1
      className={cn(
        "text-text-primary min-w-0 text-lg font-bold text-balance break-words",
        className
      )}
      {...props}
    />
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
        "font-base text-text-primary/75 min-w-0 text-base text-pretty break-words",
        className
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
        className
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
