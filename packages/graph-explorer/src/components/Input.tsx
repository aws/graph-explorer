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
  base: "flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm text-text-primary shadow-sm transition-colors file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary invalid:border-error-main focus-visible:border-primary-main focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error-main",
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
