import { cn } from "@/utils";
import { cva, type VariantProps } from "cva";
import React from "react";

const EmptyState = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col items-center justify-center",
      className
    )}
    {...props}
  />
));
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
const EmptyStateIcon = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> &
    VariantProps<typeof emptyStateIconStyles>
>(({ variant, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(emptyStateIconStyles({ variant }), className)}
    {...props}
  />
));
EmptyStateIcon.displayName = "EmptyStateIcon";

const EmptyStateContent = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "max-w-paragraph flex w-full flex-col items-center justify-center gap-1 text-center",
      className
    )}
    {...props}
  />
));
EmptyStateContent.displayName = "EmptyStateContent";

const EmptyStateTitle = React.forwardRef<
  React.ElementRef<"h1">,
  React.ComponentPropsWithoutRef<"h1">
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-text-primary min-w-0 text-lg font-bold text-balance break-words",
      className
    )}
    {...props}
  />
));
EmptyStateTitle.displayName = "EmptyStateTitle";

const EmptyStateDescription = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-base text-text-primary/75 min-w-0 text-base text-pretty break-words",
      className
    )}
    {...props}
  />
));
EmptyStateDescription.displayName = "EmptyStateDescription";

const EmptyStateActions = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-wrap items-center justify-center gap-4 pt-6",
      className
    )}
    {...props}
  />
));
EmptyStateActions.displayName = "EmptyStateActions";

export {
  EmptyState,
  EmptyStateIcon,
  EmptyStateContent,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
};
