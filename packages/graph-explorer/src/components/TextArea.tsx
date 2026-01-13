import type { ComponentPropsWithRef } from "react";

import { cn } from "@/utils";

export function TextArea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input bg-input-background text-text-primary placeholder:text-text-secondary invalid:border-error-main focus-visible:border-primary-main aria-invalid:border-error-main flex w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors file:bg-transparent file:text-sm file:font-medium focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
TextArea.displayName = "Textarea";
