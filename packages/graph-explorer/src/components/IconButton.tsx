import { cn } from "@/utils";
import { useButton } from "@react-aria/button";
import type { AriaButtonProps } from "@react-types/button";
import type { ElementType, ForwardedRef, ReactNode, RefObject } from "react";
import { forwardRef } from "react";
import type { TooltipProps } from "./Tooltip";
import Tooltip from "./Tooltip/Tooltip";
import { cva, type VariantProps } from "cva";

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
      small: "h-[24px] px-1 text-sm [&_svg]:size-[16px]",
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
      className: "text-primary-dark hover:bg-background-secondary/50",
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

type IconButtonVariants = VariantProps<typeof iconButtonVariants>;

export interface IconButtonProps
  extends Omit<AriaButtonProps<ElementType<any>>, "elementType">,
    IconButtonVariants {
  className?: string;
  icon: ReactNode;
  isDisabled?: boolean;
  as?: ElementType;
  tooltipText?: TooltipProps["text"];
  tooltipPlacement?: TooltipProps["placement"];
  onClick?(e: MouseEvent): void;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      tooltipText,
      tooltipPlacement,
      onClick,
      variant,
      size,
      color,
      ...props
    }: IconButtonProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    const { buttonProps } = useButton(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      props,
      ref as RefObject<HTMLButtonElement>
    );

    const { className, icon, as } = props;

    const Component: ElementType = as ? as : "button";

    const component = (
      <Component
        ref={ref}
        {...buttonProps}
        className={cn(iconButtonVariants({ variant, color, size }), className)}
        onClick={onClick}
      >
        {icon}
        {props.children}
      </Component>
    );

    if (tooltipText) {
      return (
        <Tooltip
          text={tooltipText}
          placement={tooltipPlacement}
          delayEnter={400}
        >
          {component}
        </Tooltip>
      );
    }

    return component;
  }
);
