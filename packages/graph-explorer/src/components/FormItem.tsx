import type { ComponentPropsWithRef } from "react";

import { cn } from "@/utils";

/** Stacks a field's label, control, and messages. */
export function FormItem({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div className={cn("space-y-3", className)} {...props} />;
}
