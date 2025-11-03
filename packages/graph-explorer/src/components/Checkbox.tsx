"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/utils";
import { CheckIcon, MinusIcon } from "lucide-react";

function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "focus-visible:ring-ring-3 group peer border-primary-main bg-primary-main size-[16px] shrink-0 rounded-sm border text-white focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
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
  );
}
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
