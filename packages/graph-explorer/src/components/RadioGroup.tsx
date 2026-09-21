import type { ComponentPropsWithRef, ReactNode } from "react";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/utils";

function RadioGroup({
  className,
  ...props
}: ComponentPropsWithRef<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("flex flex-col gap-3", className)}
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
      className={cn(
        "focus-visible:ring-primary border-primary bg-primary size-[16px] shrink-0 rounded-full border shadow-xs focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=unchecked]:bg-background data-[state=unchecked]:border-input-border",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex size-full items-center justify-center">
        <span className="bg-background size-[6px] rounded-full" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

/**
 * One choice in a radio group, with the description sitting under its label.
 *
 * The description is part of the option rather than a tooltip because a choice
 * whose consequences are not guessable from its label needs them visible while
 * the reader compares the options.
 */
function RadioGroupOption({
  value,
  label,
  description,
  id,
}: {
  value: string;
  label: ReactNode;
  description: ReactNode;
  id: string;
}) {
  return (
    <div className="flex flex-row items-start gap-2">
      <RadioGroupItem value={value} id={id} className="mt-[1.5px]" />
      <label htmlFor={id} className="cursor-pointer space-y-0.5">
        <p className="text-foreground text-sm leading-none font-medium">
          {label}
        </p>
        <p className="text-muted-foreground text-sm leading-normal text-pretty">
          {description}
        </p>
      </label>
    </div>
  );
}

export { RadioGroup, RadioGroupItem, RadioGroupOption };
