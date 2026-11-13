"use client";

import { CheckIcon, MinusIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "group peer border-primary bg-primary focus-visible:focus-ring size-[16px] shrink-0 rounded-sm border text-white shadow-xs disabled:cursor-not-allowed disabled:opacity-50",
        "data-unchecked:bg-background data-unchecked:border-input-border",
        "data-checked:focus-visible:outline-background data-[state=indeterminate]:focus-visible:outline-background",
        "aria-invalid:ring-danger/20 aria-invalid:data-unchecked:border-danger aria-invalid:ring-3",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <CheckIcon className="hidden size-[14px] group-data-checked:flex" />
        <MinusIcon className="hidden size-[14px] group-data-[state=indeterminate]:flex" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
