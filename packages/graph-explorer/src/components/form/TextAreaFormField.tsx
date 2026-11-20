import {
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
  useId,
} from "react";

import { cn } from "@/utils";

import { Field, FieldDescription, FieldError, FieldLabel } from "../Field";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "../InputGroup";
import { TextArea } from "../TextArea";
import { useFieldContext } from "./formContexts";

type TextAreaFormFieldProps = {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  /** Content inside the text area's border, below the text, such as a button. */
  addon?: ReactNode;
} & Omit<
  ComponentPropsWithRef<typeof TextArea>,
  | "id"
  | "name"
  | "value"
  | "onChange"
  | "onBlur"
  | "aria-invalid"
  | "aria-describedby"
>;

/** A text area bound to the surrounding `form.AppField`, built on `Field`. */
export function TextAreaFormField({
  label,
  hideLabel,
  description,
  addon,
  ...props
}: TextAreaFormFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const describedBy =
    [description && descriptionId, isInvalid && errorId]
      .filter(Boolean)
      .join(" ") || undefined;
  const controlProps = {
    id,
    name: field.name,
    value: field.state.value,
    onBlur: field.handleBlur,
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) =>
      field.handleChange(e.target.value),
    "aria-invalid": isInvalid,
    "aria-describedby": describedBy,
    ...props,
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
      </FieldLabel>
      {addon ? (
        <InputGroup>
          <InputGroupTextarea {...controlProps} />
          <InputGroupAddon align="block-end">{addon}</InputGroupAddon>
        </InputGroup>
      ) : (
        <TextArea {...controlProps} />
      )}
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  );
}
