import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../utils/cn";

export function LinkButton({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      className={cn(
        className,
        "m-0 cursor-pointer border-0 bg-transparent p-0 text-primary-main underline underline-offset-2 hover:no-underline"
      )}
    />
  );
}
