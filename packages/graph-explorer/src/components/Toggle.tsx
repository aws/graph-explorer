import { cva, type VariantProps } from "cva";
import { Toggle as TogglePrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/utils";

const toggleVariants = cva({
  base: "group/toggle hover:bg-muted hover:text-muted-foreground aria-invalid:border-danger aria-invalid:ring-danger/20 aria-pressed:bg-primary-subtle aria-pressed:text-primary-foreground data-[state=on]:bg-primary-subtle data-[state=on]:text-primary-foreground inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variants: {
    variant: {
      default: "bg-transparent",
      outline:
        "border-input-border hover:bg-primary-subtle hover:text-primary-foreground border bg-transparent shadow-xs",
    },
    size: {
      default:
        "h-9 min-w-9 px-3 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
      sm: "h-8 min-w-8 px-1.5 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1",
      lg: "h-10 min-w-10 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

function Toggle({
  className,
  variant = "default",
  size = "default",
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
