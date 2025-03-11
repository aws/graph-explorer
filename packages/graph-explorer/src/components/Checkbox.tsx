"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { cn } from "@/utils";
import { CheckIcon, MinusIcon } from "lucide-react";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "focus-visible:ring-ring bg-primary-main border-primary-main group peer size-[16px] shrink-0 rounded border text-white focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=unchecked]:bg-background-default data-[state=unchecked]:border-gray-400 dark:data-[state=unchecked]:border-gray-600",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <CheckIcon className="hidden size-[14px] group-data-[state=checked]:flex" />
      <MinusIcon className="hidden size-[14px] group-data-[state=indeterminate]:flex" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
