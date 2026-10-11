import type { ComponentPropsWithRef } from "react";

import { cn } from "@/utils";

export function TextArea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input-border bg-input-background text-foreground placeholder:text-muted-foreground invalid:border-danger focus-visible:border-primary aria-invalid:border-danger flex w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors file:bg-transparent file:text-sm file:font-medium focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
TextArea.displayName = "Textarea";
