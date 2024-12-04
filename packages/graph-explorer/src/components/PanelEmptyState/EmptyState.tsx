import { cn } from "@/utils";
import { cva, VariantProps } from "cva";

const EmptyState = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex h-full w-full flex-col items-center justify-center gap-6 p-6",
      className
    )}
    {...props}
  />
);
EmptyState.displayName = "EmptyState";

const EmptyStateHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-1 text-center",
      className
    )}
    {...props}
  />
);
EmptyStateHeader.displayName = "EmptyStateHeader";

const iconVariantStyles = cva({
  base: "flex size-24 items-center justify-center rounded-full text-7xl text-white [&>svg]:size-[60%]",
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

const EmptyStateIcon = ({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof iconVariantStyles>) => (
  <div className={cn(iconVariantStyles({ variant }), className)} {...props} />
);
EmptyStateIcon.displayName = "EmptyStateIcon";

const EmptyStateTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("text-text-primary text-lg font-bold", className)}
    {...props}
  />
);
EmptyStateTitle.displayName = "EmptyStateTitle";

const EmptyStateSubtitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("text-text-secondary font-base text-base", className)}
    {...props}
  />
);
EmptyStateSubtitle.displayName = "EmptyStateSubtitle";

export {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateSubtitle,
};
