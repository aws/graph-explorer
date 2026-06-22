import { cva, type VariantProps } from "cva";
import * as React from "react";

import { cn } from "@/utils";

const alertVariants = cva({
  base: "group/alert relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-data-[slot=alert-action]:pr-16 has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:row-span-2 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  variants: {
    variant: {
      default: "bg-card text-card-foreground",
      primary:
        "text-primary-foreground bg-primary-subtle/50 border-primary-foreground/50 *:data-[slot=alert-description]:text-primary-foreground/90 [&>svg]:text-current",
      danger:
        "text-danger-foreground bg-danger-subtle/50 border-danger-foreground/50 *:data-[slot=alert-description]:text-danger-foreground/90 [&>svg]:text-current",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_a]:underline [&_a]:underline-offset-2 [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

/**
 * An action element (typically a button) pinned to the top-right corner of the
 * Alert. The Alert reserves right padding when an action is present, so it never
 * overlaps the title or description.
 */
function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 right-3", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
