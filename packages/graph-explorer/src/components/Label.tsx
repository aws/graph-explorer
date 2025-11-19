import type { ComponentPropsWithRef } from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "@/utils";

export function Label({
  className,
  ...props
}: ComponentPropsWithRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "gx-wrap-break-word flex items-center gap-2 text-sm leading-tight font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
