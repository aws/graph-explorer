import { cn } from "@/utils";
import { useButton } from "@react-aria/button";
import type { AriaButtonProps } from "@react-types/button";
import type { ElementType, ForwardedRef, ReactNode, RefObject } from "react";
import { forwardRef } from "react";
import { useWithTheme } from "@/core";
import { defaultStyles } from "./Button.styles";

export interface ButtonProps
  extends Omit<AriaButtonProps<ElementType>, "elementType"> {
  className?: string;
  variant?: "filled" | "default" | "text" | "danger";
  size?: "small" | "base" | "large";
  rounded?: boolean;
  icon?: ReactNode;
  iconPlacement?: "start" | "end";
  as?: ElementType;
}

export const Button = (
  props: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) => {
  const styleWithTheme = useWithTheme();
  const { buttonProps } = useButton(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    props,
    ref as RefObject<HTMLButtonElement>
  );
  const {
    children,
    icon,
    iconPlacement = "start",
    className,
    variant = "default",
    size = "base",
    rounded = false,
    as,
  } = props;
  const Component: ElementType = as ? as : "button";

  return (
    <Component
      ref={ref}
      {...buttonProps}
      className={cn(
        styleWithTheme(defaultStyles({ variant, size, rounded })),
        className
      )}
    >
      {icon && iconPlacement === "start" && (
        <span
          className={cn(
            "mr-1 flex items-center",
            size === "small" && "h-4 w-4",
            size === "base" && "h-5 w-5",
            size === "large" && "h-6 w-6"
          )}
        >
          {icon}
        </span>
      )}
      {children}
      {icon && iconPlacement === "end" && (
        <span
          className={cn(
            "ml-1 flex items-center",
            size === "small" && "h-4 w-4",
            size === "base" && "h-5 w-5",
            size === "large" && "h-6 w-6"
          )}
        >
          {icon}
        </span>
      )}
    </Component>
  );
};

export default forwardRef<HTMLButtonElement, ButtonProps>(Button);
