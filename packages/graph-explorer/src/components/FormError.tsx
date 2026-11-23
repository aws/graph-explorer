import type { ComponentPropsWithRef } from "react";

import { cn } from "@/utils";

/** Shows a field's error message. */
export function FormError({ className, ...props }: ComponentPropsWithRef<"p">) {
  return (
    <p
      className={cn("text-danger-foreground text-sm font-medium", className)}
      {...props}
    />
  );
}
