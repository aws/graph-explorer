import type { DisplayAttribute } from "@/core";
import { cn } from "@/utils";
import type { ComponentPropsWithoutRef } from "react";

export type EntityAttributeProps = {
  attribute: DisplayAttribute;
} & ComponentPropsWithoutRef<"li">;

export default function EntityAttribute({
  attribute,
  className,
  ...props
}: EntityAttributeProps) {
  return (
    <li
      key={attribute.name}
      className={cn("space-y-0.5", className)}
      {...props}
    >
      <div className="text-text-secondary text-sm text-balance break-words">
        {attribute.displayLabel}
      </div>
      <div className="text-text-primary font-medium text-balance break-words">
        {attribute.displayValue}
      </div>
    </li>
  );
}
