import { cx } from "@emotion/css";
import { useButton } from "@react-aria/button";
import type { AriaButtonProps } from "@react-types/button";
import type { ElementType, ForwardedRef, ReactNode, RefObject } from "react";
import { forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import type { TooltipProps } from "../Tooltip";
import Tooltip from "../Tooltip/Tooltip";
import {
  defaultBadgeStyles,
  defaultIconButtonStyles,
} from "./IconButton.styles";

export interface IconButtonProps
  extends Omit<AriaButtonProps<ElementType<any>>, "elementType"> {
  classNamePrefix?: string;
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
  badge?: ReactNode;
  badgeVariant?: "determined" | "undetermined";
  badgePlacement?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onClick?(e: MouseEvent): void;
}

export const IconButton = (
  {
    classNamePrefix = "ft",
    tooltipText,
    tooltipPlacement,
    onClick,
    badge,
    color,
    badgeVariant = "undetermined",
    badgePlacement = "bottom-right",
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
  const styles = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

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
      className={cx(
        styles(defaultIconButtonStyles({ variant, size, isDisabled, rounded })),
        className,
        color ? `color-${color}` : ""
      )}
      onClick={onClick}
    >
      {icon}
      {props.children}
      {Boolean(badge) && (
        <div
          className={cx(
            styles(defaultBadgeStyles(classNamePrefix)),
            pfx("badge"),
            pfx(`variant-${badgeVariant}`),
            pfx(`placement-${badgePlacement}`)
          )}
        >
          {typeof badge !== "boolean" && badgeVariant === "determined" && badge}
        </div>
      )}
    </Component>
  );

  if (tooltipText) {
    return (
      <Tooltip text={tooltipText} placement={tooltipPlacement} delayEnter={400}>
        <span>{component}</span>
      </Tooltip>
    );
  }

  return component;
};

export default forwardRef<HTMLButtonElement, IconButtonProps>(IconButton);
