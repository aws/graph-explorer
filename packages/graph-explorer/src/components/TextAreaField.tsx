import type { AriaTextFieldOptions } from "@react-aria/textfield";
import type { ValueBase } from "@react-types/shared";
import type { RefObject } from "react";

import { useTextField } from "@react-aria/textfield";
import { useRef } from "react";

import { cn } from "@/utils";

import { FormError } from "./Form";
import { TextArea } from "./TextArea";

export interface TextAreaProps
  extends
    Omit<
      AriaTextFieldOptions<"textarea">,
      "value" | "defaultValue" | "onChange"
    >,
    ValueBase<string> {
  className?: string;
  errorMessage?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

/** @deprecated Use TextArea instead */
function TextAreaField({ ref, ...props }: TextAreaProps) {
  const { className, validationState, errorMessage } = props;
  const localRef = useRef<HTMLTextAreaElement>(null);
  const { inputProps } = useTextField(
    props,
    (ref as RefObject<HTMLTextAreaElement | null>) || localRef,
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

export default TextAreaField;
