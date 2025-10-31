import { cn } from "@/utils";
import type { PropsWithChildren } from "react";
import { cva, type VariantProps } from "cva";

const chip = cva({
  base: "chip inline-flex h-[22px] items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 text-sm font-medium text-ellipsis whitespace-nowrap text-white select-none [&>svg]:size-4",
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
});

export interface ChipProps
  extends React.ComponentPropsWithRef<"div">,
    VariantProps<typeof chip> {}

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
