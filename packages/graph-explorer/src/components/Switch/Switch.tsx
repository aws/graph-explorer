import { cn } from "@/utils";

import { forwardRef, ReactNode, RefObject } from "react";
import { useFocusRing } from "@react-aria/focus";
import { useSwitch } from "@react-aria/switch";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import type { AriaSwitchProps } from "@react-types/switch";

import { useWithTheme } from "@/core";
import { defaultSwitchLabelStyles, defaultSwitchStyles } from "./Switch.styles";

const sizeMap = {
  sm: {
    width: 35,
    height: 21,
  },
  md: {
    width: 40,
    height: 26,
  },
  lg: {
    width: 45,
    height: 31,
  },
};

export interface SwitchProps extends AriaSwitchProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  labelPosition?: "left" | "right";
  onIcon?: ReactNode;
  offIcon?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    { size = "md", labelPosition = "right", onIcon, offIcon, ...props },
    ref
  ) => {
    const { isSelected, onChange, className, isDisabled, isReadOnly } = props;
    const { inputProps } = useSwitch(
      props,
      {
        isSelected,
        setSelected: (isSelected: boolean) => onChange(isSelected),
        toggle: () => onChange(!isSelected),
      },
      ref as RefObject<HTMLInputElement>
    );
    const { isFocusVisible, focusProps } = useFocusRing();
    const styleWithTheme = useWithTheme();
    return (
      <label
        onClick={e => e.stopPropagation()}
        className={cn(className, styleWithTheme(defaultSwitchLabelStyles), {
          ["switch-label-disabled"]: isDisabled,
          ["switch-label-readonly"]: isReadOnly,
        })}
      >
        <VisuallyHidden>
          <input
            {...inputProps}
            {...focusProps}
            ref={ref as RefObject<HTMLInputElement>}
          />
        </VisuallyHidden>
        {labelPosition === "left" && <>{props.children}</>}
        <div
          style={{ width: sizeMap[size].width, height: sizeMap[size].height }}
          className={cn(
            styleWithTheme(defaultSwitchStyles(sizeMap[size].width)),
            isSelected ? "switch-on" : "switch-off",
            `switch-${size}`,
            {
              ["switch-disabled"]: isDisabled,
              ["switch-focused"]: isFocusVisible,
            }
          )}
        >
          <div className="switch-track">
            <div className="switch-handle">
              {isSelected && onIcon} {!isSelected && offIcon}
            </div>
          </div>
        </div>
        {labelPosition === "right" && <>{props.children}</>}
      </label>
    );
  }
);

export default Switch;
