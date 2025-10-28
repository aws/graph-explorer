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
      <div className="text-balance break-words text-sm text-text-secondary">
        {attribute.displayLabel}
      </div>
      <div className="text-balance break-words font-medium text-text-primary">
        {attribute.displayValue}
      </div>
    </li>
  );
}
