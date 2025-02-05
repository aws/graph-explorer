import { cn } from "@/utils";
import type { ComponentPropsWithoutRef, ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";
import { cva, type VariantProps } from "cva";
import { Tooltip, TooltipContent } from "@/components";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

const iconButtonVariants = cva({
  base: "focus-visible:ring-ring inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:saturate-0 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      filled: "text-white",
      text: "bg-transparent",
    },
    color: {
      primary: "",
      error: "",
    },
    size: {
      small: "h-[24px] px-1 text-sm [&_svg]:size-[20px]",
      base: "size-[30px] text-base [&_svg]:size-[22px]",
      large: "h-[42px] px-4 text-lg [&_svg]:size-[26px]",
    },
  },
  compoundVariants: [
    {
      variant: "filled",
      color: "primary",
      className: "bg-primary-main hover:bg-primary-light",
    },
    {
      variant: "filled",
      color: "error",
      className: "bg-error-main hover:bg-error-light",
    },
    {
      variant: "text",
      color: "primary",
      className: "text-primary-dark hover:bg-background-secondary-subtle",
    },
    {
      variant: "text",
      color: "error",
      className: "text-error-main hover:bg-error-light/20",
    },
  ],
  defaultVariants: {
    variant: "filled",
    size: "base",
    color: "primary",
  },
});

export interface IconButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "color">,
    VariantProps<typeof iconButtonVariants> {
  icon: ReactNode;
  tooltipText?: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      tooltipText,
      variant,
      size,
      color,
      className,
      icon,
      ...props
    }: IconButtonProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const component = (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, color, size }), className)}
        {...props}
      >
        {icon}
        {props.children}
      </button>
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
