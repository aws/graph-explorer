import { cn } from "@/utils";
import type { ForwardedRef, HTMLAttributes, PropsWithChildren } from "react";
import { forwardRef } from "react";
import { cva, VariantProps } from "class-variance-authority";

const chip = cva(
  [
    "chip font-base inline-flex h-[22px] items-center select-none justify-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-2.5 text-sm text-white [&>svg]:size-4",
  ],
  {
    variants: {
      variant: {
        info: "bg-info-main",
        success: "bg-success-main",
        error: "bg-error-main",
        warning: "bg-warning-main",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export interface ChipProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chip> {}

export const Chip = (
  { children, className, variant, ...allProps }: PropsWithChildren<ChipProps>,
  ref: ForwardedRef<HTMLDivElement>
) => {
  return (
    <div ref={ref} className={cn(chip({ variant }), className)} {...allProps}>
      {children}
    </div>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<ChipProps>>(Chip);
