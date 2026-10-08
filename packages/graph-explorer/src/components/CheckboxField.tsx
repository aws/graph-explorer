import { useId } from "react";

import { Checkbox } from "./Checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel } from "./Field";

type CheckboxFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** A checkbox with its label beside it and a description beneath the label. */
export function CheckboxField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: CheckboxFieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <Field orientation="horizontal" data-disabled={disabled}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={value => onCheckedChange(value === true)}
        aria-describedby={descriptionId}
      />
      <FieldContent>
        <FieldLabel
          htmlFor={id}
          className="text-foreground cursor-pointer group-data-[disabled=true]/field:cursor-not-allowed"
        >
          {label}
        </FieldLabel>
        <FieldDescription
          id={descriptionId}
          className="group-data-[disabled=true]/field:opacity-50"
        >
          {description}
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}
