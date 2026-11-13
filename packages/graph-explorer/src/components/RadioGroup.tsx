import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer border-input-border bg-input-background aria-invalid:border-danger data-checked:border-primary data-checked:bg-primary focus-visible:focus-ring data-checked:focus-visible:outline-background relative flex aspect-square size-4 shrink-0 rounded-full border outline-none group-has-[:focus-visible]/field-label:focus-visible:ring-0 group-has-[:focus-visible]/field-label:focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-checked:text-white",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-2 rounded-full bg-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
