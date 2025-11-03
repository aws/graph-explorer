import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/utils";

function Label({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "font-base text-text-secondary inline-flex items-center gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
