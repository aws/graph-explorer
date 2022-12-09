import { cx } from "@emotion/css";
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
import { useWithTheme, withClassNamePrefix } from "../../core";
import { inputContainerStyles } from "./Input.styles";

export interface BaseInputProps
  extends Omit<
    AriaTextFieldOptions<"input" | "textarea">,
    "value" | "defaultValue" | "onChange"
  > {
  label?: ReactNode;
  labelPlacement?: "top" | "left" | "inner";
  className?: string;
  classNamePrefix?: string;
  errorMessage?: string;
  fullWidth?: boolean;
  hideError?: boolean;
  autocomplete?: "off" | "new-password";
  size?: "sm" | "md";
  component?: "input" | "textarea";
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
    classNamePrefix = "ft",
    size = "md",
    fullWidth = false,
    hideError = false,
    component = "input",
    startAdornment,
    endAdornment,
    noMargin = false,
    onClick,
    clearButton,
    overrideInputProps,
    ...props
  }: InputProps,
  ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
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
  const pfx = withClassNamePrefix(classNamePrefix);
  const localRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
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
    (ref as RefObject<HTMLInputElement | HTMLTextAreaElement>) || localRef
  );

  const clickHandlers = onClick ? { onClick } : {};
  return (
    <div
      className={cx(
        styleWithTheme(
          inputContainerStyles(
            labelPlacement,
            classNamePrefix,
            size,
            isDisabled,
            validationState,
            fullWidth,
            hideError,
            isReadOnly,
            startAdornment,
            endAdornment,
            component === "textarea",
            noMargin
          )
        ),
        pfx(`input-label-${labelPlacement}`),
        pfx("input-wrapper"),
        className
      )}
    >
      {label && (
        <label className={pfx("input-label")} {...labelProps}>
          {label}
        </label>
      )}
      <div className={pfx("input-container")}>
        {!!startAdornment && (
          <span className={pfx("start-adornment")}>{startAdornment}</span>
        )}
        {component === "input" && (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          /*@ts-ignore*/
          <input
            {...clickHandlers}
            className={cx(pfx("input"), {
              [pfx("input-disabled")]: isDisabled,
              [pfx("input-label-inner")]: labelPlacement === "inner",
            })}
            min={isNumberInput(props) ? props.min : undefined}
            max={isNumberInput(props) ? props.max : undefined}
            step={isNumberInput(props) ? props.step : undefined}
            ref={(ref as RefObject<HTMLInputElement>) || localRef}
            {...inputProps}
            {...overrideInputProps}
          />
        )}
        {component === "textarea" && (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          /*@ts-ignore*/
          <textarea
            {...clickHandlers}
            className={cx(pfx("input"), {
              [pfx("input-disabled")]: isDisabled,
              [pfx("input-label-inner")]: labelPlacement === "inner",
            })}
            ref={(ref as RefObject<HTMLTextAreaElement>) || localRef}
            {...inputProps}
          />
        )}
        {!!endAdornment && (
          <span className={pfx("end-adornment")}>{endAdornment}</span>
        )}
        {!!clearButton && (
          <span className={pfx("clearButton")}>{clearButton}</span>
        )}
        {validationState === "invalid" && !!errorMessage && !hideError && (
          <div className={pfx("input-error")}>{errorMessage}</div>
        )}
      </div>
    </div>
  );
};

export default forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  Input
);
