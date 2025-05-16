import { cn } from "@/utils";
import type { AriaTextFieldOptions } from "@react-aria/textfield";
import { useTextField } from "@react-aria/textfield";
import type { ValueBase } from "@react-types/shared";
import type { ForwardedRef, RefObject } from "react";
import { forwardRef, useRef } from "react";
import { FormError } from "./Form";
import { TextArea } from "./TextArea";

export interface TextAreaProps
  extends Omit<
      AriaTextFieldOptions<"textarea">,
      "value" | "defaultValue" | "onChange"
    >,
    ValueBase<string> {
  className?: string;
  errorMessage?: string;
}

/** @deprecated Use TextArea instead */
const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ ...props }: TextAreaProps, ref: ForwardedRef<HTMLTextAreaElement>) => {
    const { className, validationState, errorMessage } = props;
    const localRef = useRef<HTMLTextAreaElement>(null);
    const { inputProps } = useTextField(
      props,
      (ref as RefObject<HTMLTextAreaElement | null>) || localRef
    );

    return (
      <div className={cn("space-y-1", className)}>
        <TextArea className={className} ref={ref || localRef} {...inputProps} />
        {validationState === "invalid" && !!errorMessage && (
          <FormError>{errorMessage}</FormError>
        )}
      </div>
    );
  }
);

export default TextAreaField;
