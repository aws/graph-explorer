import { cn } from "@/utils";
import type { ForwardedRef } from "react";
import { forwardRef } from "react";
import { cva } from "cva";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { Button, type ButtonProps } from "./Button/Button";

export const iconButtonStyles = cva({
  base: "px-0",
  variants: {
    size: {
      small: "h-8 min-w-8 rounded-sm text-base [&_svg]:size-5",
      base: "h-10 min-w-10 rounded-md text-base [&_svg]:size-[1.325rem]",
      large: "h-12 min-w-12 rounded-md text-lg [&_svg]:size-6",
    },
  },
  defaultVariants: {
    size: "base",
  },
});
export interface IconButtonProps extends ButtonProps {
  tooltipText?: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { tooltipText, size, className, children, ...props }: IconButtonProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const component = (
      <Button
        ref={ref}
        size={size}
        className={cn(iconButtonStyles({ size }), className)}
        {...props}
      >
        {children}
        <span className="sr-only">{tooltipText}</span>
      </Button>
    );

    if (tooltipText) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{component}</TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      );
    }

    return component;
  }
);
