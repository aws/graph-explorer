import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/utils";

/**
 * The bordered canvas-tinted surface that a style preview (vertex or edge)
 * floats on inside a style dialog. Centers its content and matches the graph
 * canvas background so the preview reads as "how this looks on the canvas".
 */
export function PreviewSurface({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "bg-workspace-canvas border-input-border grid place-items-center rounded-lg border px-6 py-4 shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
