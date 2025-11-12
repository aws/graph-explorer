import type { ComponentPropsWithRef } from "react";
import { cn } from "@/utils";

export function TableColumnResizer({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn("absolute inset-y-0 right-0 z-1 w-2", className)}
    />
  );
}
