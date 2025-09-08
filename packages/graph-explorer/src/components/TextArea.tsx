import { cn } from "@/utils";
import { ComponentPropsWithRef } from "react";

export function TextArea({
  className,
  ...props
}: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "placeholder:text-text-secondary text-text-primary focus-visible:border-primary-main border-input bg-input-background aria-invalid:border-error-main invalid:border-error-main flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
TextArea.displayName = "Textarea";
