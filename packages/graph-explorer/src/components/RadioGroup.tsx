import type { ComponentPropsWithRef } from "react";

import { CircleIcon } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/utils";

function RadioGroup({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-input-border text-primary-foreground aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
