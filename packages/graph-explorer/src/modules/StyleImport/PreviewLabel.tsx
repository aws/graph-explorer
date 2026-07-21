import type { ComponentProps } from "react";

import { cn } from "@/utils";

/** Tags a preview cell as the current or incoming style. */
export function PreviewLabel({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-primary-foreground text-xs font-semibold tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}
