import { useState } from "react";

import { parseNumberSafely } from "@/utils/parseNumberSafely";

import { Input, type InputProps } from "./Input";

export interface NumberInputProps extends Omit<
  InputProps,
  "type" | "value" | "onChange" | "onBlur"
> {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
}

/**
 * A numeric input that keeps the raw editing buffer (e.g. "1." or "") on
 * screen while reporting parsed numbers upward. Binding a controlled input
 * directly to a number destroys intermediate states — `Number("1.")` is `1`,
 * so the decimal point vanishes as soon as it is typed or exposed by
 * deleting a digit.
 *
 * While the user is editing, the draft string owns the display. Outside of an
 * edit the display derives directly from the value prop, so external changes
 * (e.g. Reset to Default, which blurs the input by taking focus) always show.
 */
export function NumberInput({
  value,
  onValueChange,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      type="number"
      value={draft ?? formatValue(value)}
      onChange={e => {
        setDraft(e.target.value);
        onValueChange(parseNumberSafely(e.target.value));
      }}
      onBlur={() => setDraft(null)}
      {...props}
    />
  );
}

function formatValue(value: number | undefined) {
  return value === undefined ? "" : String(value);
}
