import { cx } from "@emotion/css";
import { useCheckbox } from "@react-aria/checkbox";
import { useFocusRing } from "@react-aria/focus";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import type { AriaCheckboxProps } from "@react-types/checkbox";
import type { PropsWithChildren } from "react";
import { useCallback, useRef } from "react";
import { useTheme, useWithTheme, withClassNamePrefix } from "../../core";
import { checkboxStyles, labelStyles } from "./Checkbox.styles";

export enum CheckboxSizes {
  "sm" = "sm",
  "md" = "md",
  "lg" = "lg",
}

export interface CheckboxProps
  extends Omit<AriaCheckboxProps, "defaultSelected" | "isRequired"> {
  /* size of the Checkbox sm, md or lg*/
  size?: CheckboxSizes | keyof typeof CheckboxSizes;
  onChange: (isSelected: boolean) => void;
  className?: string;
  classNamePrefix?: string;
}

const defaultSizeMap: Record<CheckboxSizes, number> = {
  sm: 24,
  md: 28,
  lg: 32,
};

const scaconstick = (size: number) => {
  return size / defaultSizeMap.md;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

export const Checkbox = ({
  size = "md",
  classNamePrefix = "ft",
  className,
  ...props
}: PropsWithChildren<CheckboxProps>) => {
  const ref = useRef<HTMLInputElement>(null);
  const [theme] = useTheme();
  const sizeMap = theme?.theme?.checkbox?.sizes || defaultSizeMap;

  const { isSelected, isIndeterminate, onChange, children } = props;

  const handleChange = useCallback(
    (isSelected: boolean) => {
      onChange(isSelected);
    },
    [onChange]
  );

  const { inputProps } = useCheckbox(
    props,
    {
      isSelected: isSelected || false,
      setSelected: handleChange,
      toggle: NOOP,
    },
    ref
  );
  const { isFocusVisible, focusProps } = useFocusRing();

  const isSelectedOrIndeterminate = isSelected || isIndeterminate;
  const computedSize = sizeMap[size] || 28;

  const pfx = withClassNamePrefix(classNamePrefix);
  const styleWithTheme = useWithTheme();
  return (
    <label
      className={cx(
        styleWithTheme(labelStyles(classNamePrefix)),
        {
          [pfx("checkbox-label-disabled")]: props.isDisabled,
          [pfx("checkbox-label-readonly")]: props.isReadOnly,
          [pfx("checkbox-label-invalid")]: props.validationState === "invalid",
        },
        className
      )}
    >
      <VisuallyHidden>
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>
      <svg
        width={computedSize}
        height={computedSize}
        className={cx(styleWithTheme(checkboxStyles(classNamePrefix)), {
          [pfx("checkbox-selected")]: isSelected,
          [pfx("checkbox-disabled")]: props.isDisabled,
          [pfx("checkbox-readonly")]: props.isReadOnly,
          [pfx("checkbox-indeterminate")]: props.isIndeterminate,
          [pfx("checkbox-invalid")]: props.validationState === "invalid",
        })}
        aria-hidden="true"
      >
        <rect
          x={isSelectedOrIndeterminate ? 4 : 5}
          y={isSelectedOrIndeterminate ? 4 : 5}
          width={
            isSelectedOrIndeterminate ? computedSize - 10 : computedSize - 12
          }
          height={
            isSelectedOrIndeterminate ? computedSize - 10 : computedSize - 12
          }
          strokeWidth={2}
          rx={1}
          ry={1}
        />
        {isSelected && !isIndeterminate && (
          <path
            transform={`translate(1 1), scale(${scaconstick(computedSize)})`}
            d="M5 12l5 5 9-9-1.41-1.42L10 14.17l-3.59-3.58L5 12z"
          />
        )}
        {isIndeterminate && (
          <path
            transform={`translate(1 1), scale(${scaconstick(computedSize)})`}
            d="M7 13 L17 13L17 11L7 11L7 13"
          />
        )}
        {isFocusVisible && (
          <rect
            x={3}
            y={3}
            rx={1}
            ry={1}
            width={computedSize - 8}
            height={computedSize - 8}
            fill="none"
            stroke="orange"
            strokeOpacity="0.5"
            strokeWidth={3}
          />
        )}
      </svg>
      {children}
    </label>
  );
};

export default Checkbox;
