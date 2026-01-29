import type { PropsWithChildren } from "react";

import { cva, type VariantProps } from "cva";

import { cn } from "@/utils";

const chip = cva({
  base: "chip inline-flex h-[22px] items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 text-sm leading-none font-medium text-ellipsis whitespace-nowrap text-white select-none [&>svg]:size-4",
  variants: {
    variant: {
      neutral: "bg-neutral",
      "neutral-subtle":
        "bg-neutral-subtle text-neutral-foreground border-neutral-foreground/25 border",
      primary: "bg-primary-main",
      "primary-subtle":
        "bg-primary-subtle text-primary-foreground border-primary-foreground/25 border",
      success: "bg-success-main",
      error: "bg-error-main",
      warning: "bg-warning-main",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export interface ChipProps
  extends React.ComponentPropsWithRef<"div">, VariantProps<typeof chip> {}

export function Chip({
  children,
  className,
  variant,
  ...allProps
}: PropsWithChildren<ChipProps>) {
  return (
    <div className={cn(chip({ variant }), className)} {...allProps}>
      {children}
    </div>
  );
}

export default Chip;
