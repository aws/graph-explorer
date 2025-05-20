import * as React from "react";
import { cn } from "@/utils";
import { cva } from "cva";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/*
 * DEV NOTE: There's not a set of variants here, but I wanted a consistent way
 * to share the input styles.
 *
 * This style is used for color input from react-colorful.
 */

export const inputStyles = cva({
  base: "placeholder:text-text-secondary text-text-primary focus-visible:ring-ring border-divider bg-input-background hover:bg-input-hover invalid:ring-error-main aria-invalid:ring-error-main aria-invalid:border-error-main invalid:border-error-main flex h-10 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
});

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputStyles(), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
