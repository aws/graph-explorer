import { cx } from "@emotion/css";

import { useToggleButton } from "@react-aria/button";
import { useWithTheme, withClassNamePrefix } from "../../core";

import { AriaToggleButtonProps } from "@react-types/button";
import { ElementType, forwardRef, RefObject } from "react";
import { defaultToggleButtonStyles } from "../IconButton/IconButton.styles";
import Tooltip, { TooltipProps } from "../Tooltip";

export interface ToggleButtonProps
  extends Omit<AriaToggleButtonProps<ElementType<any>>, "elementType"> {
  className?: string;
  classNamePrefix?: string;
  variant?: "filled" | "default" | "text";
  size?: "small" | "base" | "large";
  rounded?: boolean;
  isSelected: boolean;
  isReadOnly?: boolean;
  toggle: () => void;
  styleLike: "button" | "iconButton";
  tooltipText?: TooltipProps["text"];
  tooltipPlacement?: TooltipProps["placement"];
}

const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ tooltipText, tooltipPlacement, ...props }, ref) => {
    const {
      className,
      styleLike = "button",
      variant = "default",
      size = "base",
      rounded = false,
      children,
      isSelected,
      toggle,
      classNamePrefix = "ft",
      isDisabled,
      isReadOnly,
    } = props;
    const styles = useWithTheme();

    const pfx = withClassNamePrefix(classNamePrefix);
    const { buttonProps } = useToggleButton(
      props,
      {
        isSelected,
        setSelected: () => {},
        toggle,
      },
      ref as RefObject<HTMLButtonElement>
    );

    const component = (
      <button
        ref={ref}
        {...buttonProps}
        className={cx(
          styles(
            defaultToggleButtonStyles({
              variant,
              size,
              styleLike,
              isSelected,
              isDisabled,
              rounded,
            })
          ),
          className,
          pfx("toggle-button"),
          {
            [pfx("toggle-button-active")]: isSelected,
            [pfx("toggle-button-inactive")]: !isSelected,
            [pfx("toggle-button-readonly")]: isReadOnly,
            [pfx("toggle-button-disabled")]: isDisabled,
          }
        )}
      >
        {children}
      </button>
    );

    if (tooltipText) {
      return (
        <Tooltip
          text={tooltipText}
          placement={tooltipPlacement}
          delayEnter={400}
        >
          <span>{component}</span>
        </Tooltip>
      );
    }

    return component;
  }
);

export default ToggleButton;
