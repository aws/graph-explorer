import { cn } from "@/utils";
import type { ComponentPropsWithRef } from "react";

export function TextArea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-text-primary shadow-sm transition-colors file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary invalid:border-error-main focus-visible:border-primary-main focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error-main",
        className
      )}
      {...props}
    />
  );
}
TextArea.displayName = "Textarea";
