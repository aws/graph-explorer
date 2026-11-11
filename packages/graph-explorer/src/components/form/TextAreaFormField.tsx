import { type ComponentPropsWithRef, type ReactNode, useId } from "react";

import { cn } from "@/utils";

import { Field, FieldDescription, FieldError, FieldLabel } from "../Field";
import { TextArea } from "../TextArea";
import { useFieldContext } from "./formContexts";

type TextAreaFormFieldProps = {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
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
  className,
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

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
      </FieldLabel>
      <TextArea
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={e => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        className={className}
        {...props}
      />
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      {isInvalid && (
        <FieldError id={errorId} errors={field.state.meta.errors} />
      )}
    </Field>
  );
}
