import { cva, type VariantProps } from "cva";

import { cn } from "@/utils";

const groupVariants = cva({
  base: "group/group divide-y rounded-xl border",
  variants: {
    variant: {
      default: "border-border divide-border",
      danger: "border-danger-foreground/25 divide-danger-foreground/25",
      success: "border-success-foreground/25 divide-success-foreground/25",
      warning: "border-warning-foreground/25 divide-warning-foreground/25",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Group({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof groupVariants> & { size?: "default" | "small" }) {
  return (
    <div
      data-variant={variant}
      data-size={size}
      className={cn(groupVariants({ variant }), className)}
      {...props}
    />
  );
}

function GroupHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-neutral-subtle/50 text-text-secondary group-data-[variant=danger]/group:bg-danger-subtle/50 group-data-[variant=danger]/group:text-danger group-data-[variant=success]/group:bg-success-subtle/50 group-data-[variant=success]/group:text-success-main group-data-[variant=warning]/group:bg-warning-subtle/50 group-data-[variant=warning]/group:text-warning-main flex items-center gap-2 px-5 py-3 group-data-[size=small]/group:px-3 group-data-[size=small]/group:py-2",
        className,
      )}
      {...props}
    />
  );
}

function GroupMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex shrink-0 items-center [&>svg]:size-4", className)}
      {...props}
    />
  );
}

function GroupTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "flex-1 text-xs font-medium tracking-wide uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

function GroupItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "space-y-4 px-5 py-4 group-data-[size=small]/group:px-3 group-data-[size=small]/group:py-2",
        className,
      )}
      {...props}
    />
  );
}

export { Group, GroupHeader, GroupMedia, GroupTitle, GroupItem };
export type { VariantProps };
