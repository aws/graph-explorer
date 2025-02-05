import { cn } from "@/utils";
import { ComponentPropsWithoutRef } from "react";

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
        "bg-background-secondary-subtle hover:ring-primary-dark/50 has-[:checked]:ring-primary-dark/50 flex items-center gap-4 overflow-hidden rounded-lg px-3 py-1.5 ring-1 ring-transparent transition-shadow duration-150 hover:ring-1",
        isDisabled && "pointer-events-none",
        className
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
      className={cn("text-primary-dark line-clamp-1 font-bold", className)}
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
      className={cn("text-primary-dark/85 line-clamp-2 text-sm", className)}
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
