import { cn } from "@/utils";
import type { AriaTextFieldOptions } from "@react-aria/textfield";
import { useTextField } from "@react-aria/textfield";
import type { ValueBase } from "@react-types/shared";
import type { ForwardedRef, RefObject } from "react";
import { forwardRef, useRef } from "react";
import { FormError } from "../Form";

export interface TextAreaProps
  extends Omit<
      AriaTextFieldOptions<"textarea">,
      "value" | "defaultValue" | "onChange"
    >,
    ValueBase<string> {
  className?: string;
  errorMessage?: string;
}

export const TextArea = (
  { ...props }: TextAreaProps,
  ref: ForwardedRef<HTMLTextAreaElement>
) => {
  const { className, validationState, errorMessage } = props;
  const localRef = useRef<HTMLTextAreaElement>(null);
  const { inputProps } = useTextField(
    props,
    (ref as RefObject<HTMLTextAreaElement>) || localRef
  );

  return (
    <div className={cn("space-y-1", className)}>
      <textarea
        className={cn(
          "placeholder:text-text-secondary text-text-primary focus-visible:ring-ring border-divider bg-input-background hover:bg-input-hover flex w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          validationState === "invalid" && "ring-error-main ring-1",
          className
        )}
        ref={ref || localRef}
        {...inputProps}
      />
      {validationState === "invalid" && !!errorMessage && (
        <FormError>{errorMessage}</FormError>
      )}
    </div>
  );
};

export default forwardRef<HTMLTextAreaElement, TextAreaProps>(TextArea);
