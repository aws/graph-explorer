import { cn } from "@/utils";
import type { ComponentPropsWithRef } from "react";

export function TextArea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input bg-input-background text-text-primary placeholder:text-text-secondary invalid:border-error-main focus-visible:border-primary-main aria-invalid:border-error-main flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
TextArea.displayName = "Textarea";
