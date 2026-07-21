import { cva, type VariantProps } from "cva";
import { Toggle as TogglePrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/utils";

const toggleVariants = cva({
  base: "hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-primary-subtle data-[state=on]:text-primary-foreground focus-visible:ring-primary aria-invalid:ring-danger/20 aria-invalid:border-danger inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-hidden transition-[color,box-shadow] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      default: "bg-transparent",
      outline:
        "border-input-border hover:bg-primary-subtle hover:text-primary-foreground border bg-transparent shadow-xs",
    },
    size: {
      default: "h-9 min-w-9 px-2",
      sm: "h-8 min-w-8 px-1.5",
      lg: "h-10 min-w-10 px-2.5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
