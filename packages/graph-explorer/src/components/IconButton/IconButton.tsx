import { cn } from "@/utils";
import { useButton } from "@react-aria/button";
import type { AriaButtonProps } from "@react-types/button";
import type { ElementType, ForwardedRef, ReactNode, RefObject } from "react";
import { forwardRef } from "react";
import { useWithTheme } from "@/core";
import type { TooltipProps } from "../Tooltip";
import Tooltip from "../Tooltip/Tooltip";
import { defaultIconButtonStyles } from "./IconButton.styles";

export interface IconButtonProps
  extends Omit<AriaButtonProps<ElementType<any>>, "elementType"> {
  className?: string;
  color?: "primary" | "error" | "info" | "success" | "warning";
  variant?: "filled" | "default" | "text";
  rounded?: boolean;
  size?: "small" | "base" | "large";
  icon: ReactNode;
  isDisabled?: boolean;
  as?: ElementType;
  tooltipText?: TooltipProps["text"];
  tooltipPlacement?: TooltipProps["placement"];
  onClick?(e: MouseEvent): void;
}

export const IconButton = (
  { tooltipText, tooltipPlacement, onClick, color, ...props }: IconButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) => {
  const { buttonProps } = useButton(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props,
    ref as RefObject<HTMLButtonElement>
  );
  const styles = useWithTheme();

  const {
    className,
    variant = "default",
    size = "base",
    rounded = false,
    isDisabled,
    icon,
    as,
  } = props;

  const Component: ElementType = as ? as : "button";

  const component = (
    <Component
      ref={ref}
      {...buttonProps}
      className={cn(
        styles(defaultIconButtonStyles({ variant, size, isDisabled, rounded })),
        className,
        color ? `color-${color}` : ""
      )}
      onClick={onClick}
    >
      {icon}
      {props.children}
    </Component>
  );

  if (tooltipText) {
    return (
      <Tooltip text={tooltipText} placement={tooltipPlacement} delayEnter={400}>
        {component}
      </Tooltip>
    );
  }

  return component;
};

export default forwardRef<HTMLButtonElement, IconButtonProps>(IconButton);
