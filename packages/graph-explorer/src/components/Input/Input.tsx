import { cn } from "@/utils";
import type { AriaTextFieldOptions } from "@react-aria/textfield";
import { useTextField } from "@react-aria/textfield";
import type { ValueBase } from "@react-types/shared";
import type {
  ForwardedRef,
  InputHTMLAttributes,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from "react";
import { forwardRef, useRef } from "react";
import { useWithTheme } from "@/core";
import { inputContainerStyles } from "./Input.styles";

export interface BaseInputProps
  extends Omit<
    AriaTextFieldOptions<"input">,
    "value" | "defaultValue" | "onChange"
  > {
  label?: ReactNode;
  labelPlacement?: "top" | "left" | "inner";
  className?: string;
  errorMessage?: string;
  fullWidth?: boolean;
  hideError?: boolean;
  autocomplete?: "off" | "new-password";
  size?: "sm" | "md";
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  noMargin?: boolean;
  onClick?: MouseEventHandler;
  clearButton?: ReactNode;
  overrideInputProps?: InputHTMLAttributes<HTMLInputElement>;
}

interface TextInputProps extends BaseInputProps, ValueBase<string> {}

interface NumberInputProps extends BaseInputProps, ValueBase<number> {
  type: "number";
  component?: "input";
  min?: number;
  max?: number;
  step?: number;
}

export type InputProps = TextInputProps | NumberInputProps;

const isNumberInput = (props: InputProps): props is NumberInputProps =>
  props.type === "number";

export const Input = (
  {
    labelPlacement = "top",
    size = "md",
    fullWidth = false,
    hideError = false,
    startAdornment,
    endAdornment,
    noMargin = false,
    onClick,
    clearButton,
    overrideInputProps,
    ...props
  }: InputProps,
  ref: ForwardedRef<HTMLInputElement>
) => {
  const {
    label,
    className,
    validationState,
    errorMessage,
    isDisabled,
    isReadOnly,
  } = props;
  const styleWithTheme = useWithTheme();
  const localRef = useRef<HTMLInputElement>(null);
  const { labelProps, inputProps } = useTextField(
    {
      ...props,
      value: isNumberInput(props)
        ? String(props.value)
        : (props.value as string),
      defaultValue: isNumberInput(props)
        ? String(props.defaultValue)
        : (props.defaultValue as string),
      onChange: isNumberInput(props)
        ? // It returns null if the field is empty
          (v: string) =>
            (props.onChange as (v: number | null) => void)?.(
              v && !isNaN(Number(v)) ? Number(v) : null
            )
        : (props.onChange as (v: string) => void),
    },
    (ref as RefObject<HTMLInputElement>) || localRef
  );

  const clickHandlers = onClick ? { onClick } : {};
  return (
    <div
      className={cn(
        styleWithTheme(
          inputContainerStyles(
            labelPlacement,
            size,
            isDisabled,
            validationState,
            fullWidth,
            hideError,
            isReadOnly,
            startAdornment,
            endAdornment,
            noMargin
          )
        ),
        `input-label-${labelPlacement}`,
        "input-wrapper",
        className
      )}
    >
      {label && (
        <label className="input-label" {...labelProps}>
          {label}
        </label>
      )}
      <div className="input-container">
        {!!startAdornment && (
          <span className="start-adornment">{startAdornment}</span>
        )}
        <input
          {...clickHandlers}
          className={cn("input", {
            ["input-disabled"]: isDisabled,
            ["input-label-inner"]: labelPlacement === "inner",
          })}
          min={isNumberInput(props) ? props.min : undefined}
          max={isNumberInput(props) ? props.max : undefined}
          step={isNumberInput(props) ? props.step : undefined}
          ref={ref || localRef}
          {...inputProps}
          {...overrideInputProps}
        />

        {!!endAdornment && (
          <span className="end-adornment">{endAdornment}</span>
        )}
        {!!clearButton && <span className="clearButton">{clearButton}</span>}
        {validationState === "invalid" && !!errorMessage && !hideError && (
          <div className="input-error">{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default forwardRef<HTMLInputElement, InputProps>(Input);
