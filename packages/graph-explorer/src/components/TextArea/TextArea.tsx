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
import { textAreaContainerStyles } from "./TextArea.styles";

export interface TextAreaProps
  extends Omit<
      AriaTextFieldOptions<"textarea">,
      "value" | "defaultValue" | "onChange"
    >,
    ValueBase<string> {
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
  overrideInputProps?: InputHTMLAttributes<HTMLTextAreaElement>;
}

export const TextArea = (
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
  }: TextAreaProps,
  ref: ForwardedRef<HTMLTextAreaElement>
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
  const localRef = useRef<HTMLTextAreaElement>(null);
  const { labelProps, inputProps } = useTextField(
    props,
    (ref as RefObject<HTMLTextAreaElement>) || localRef
  );

  const clickHandlers = onClick ? { onClick } : {};
  return (
    <div
      className={cn(
        styleWithTheme(
          textAreaContainerStyles(
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
        <textarea
          {...clickHandlers}
          className={cn("input", {
            ["input-disabled"]: isDisabled,
            ["input-label-inner"]: labelPlacement === "inner",
          })}
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

export default forwardRef<HTMLTextAreaElement, TextAreaProps>(TextArea);
