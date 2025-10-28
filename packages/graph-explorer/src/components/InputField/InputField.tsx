import { cn } from "@/utils";
import type { AriaTextFieldOptions } from "@react-aria/textfield";
import { useTextField } from "@react-aria/textfield";
import type { ValueBase } from "@react-types/shared";
import type { ForwardedRef, ReactNode, RefObject } from "react";
import { forwardRef, useRef } from "react";
import { Label } from "../Label";
import { FormError, FormItem } from "../Form";
import { Input } from "../Input";

export interface BaseInputProps
  extends Omit<
    AriaTextFieldOptions<"input">,
    "value" | "defaultValue" | "onChange"
  > {
  label?: ReactNode;
  labelPlacement?: "top" | "inner";
  className?: string;
  errorMessage?: string;
}

interface TextInputProps extends BaseInputProps, ValueBase<string> {}

interface NumberInputProps extends BaseInputProps, ValueBase<number> {
  type: "number";
  component?: "input";
  min?: number;
  max?: number;
  step?: number;
}

export type InputFieldProps = TextInputProps | NumberInputProps;

const isNumberInput = (props: InputFieldProps): props is NumberInputProps =>
  props.type === "number";

export const InputField = (
  { labelPlacement = "top", ...props }: InputFieldProps,
  ref: ForwardedRef<HTMLInputElement>
) => {
  const { label, className, validationState, errorMessage, isDisabled } = props;
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
    (ref as RefObject<HTMLInputElement | null>) || localRef
  );

  if (labelPlacement === "inner") {
    return (
      <FormItem className={className}>
        <div className="relative">
          <Input
            className={cn("h-11 pt-4")}
            min={isNumberInput(props) ? props.min : undefined}
            max={isNumberInput(props) ? props.max : undefined}
            step={isNumberInput(props) ? props.step : undefined}
            ref={ref || localRef}
            disabled={isDisabled}
            {...inputProps}
          />
          <div className="absolute left-3 top-1.5 text-xs leading-none text-text-secondary">
            {label}
          </div>
        </div>
        {validationState === "invalid" && !!errorMessage && (
          <FormError>{errorMessage}</FormError>
        )}
      </FormItem>
    );
  }

  return (
    <FormItem>
      {label && <Label {...labelProps}>{label}</Label>}
      <Input
        disabled={isDisabled}
        min={isNumberInput(props) ? props.min : undefined}
        max={isNumberInput(props) ? props.max : undefined}
        step={isNumberInput(props) ? props.step : undefined}
        ref={ref || localRef}
        {...inputProps}
      />

      {validationState === "invalid" && errorMessage ? (
        <FormError>{errorMessage}</FormError>
      ) : null}
    </FormItem>
  );
};

export default forwardRef<HTMLInputElement, InputFieldProps>(InputField);
