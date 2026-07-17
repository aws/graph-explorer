import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/utils";

export function ListRow({
  className,
  isDisabled,
  ...props
}: {
  isDisabled?: boolean;
} & ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-primary-subtle text-primary-foreground ring-primary flex items-center gap-4 overflow-hidden rounded-lg px-4 py-2 hover:ring-1",
        "has-checked:bg-primary-subtle has-checked:border-primary has-checked:ring-primary has-checked:ring-[1.5px]",
        isDisabled && "pointer-events-none",
        className,
      )}
      aria-disabled={isDisabled}
      {...props}
    />
  );
}

export function ListRowTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "gx-wrap-break-word line-clamp-1 text-base leading-6 font-semibold text-current",
        className,
      )}
      {...props}
    />
  );
}

export function ListRowSubtitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "gx-wrap-break-word line-clamp-2 text-base leading-6 text-current opacity-75",
        className,
      )}
      {...props}
    />
  );
}

export function ListRowContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("flex grow flex-col", className)} {...props} />;
}
