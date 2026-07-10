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
 */
export function NumberInput({
  value,
  onValueChange,
  ...props
}: NumberInputProps) {
  const [buffer, setBuffer] = useState(formatValue(value));
  const [syncedValue, setSyncedValue] = useState(value);
  // The last parsed value we reported upward via onValueChange.
  const [reportedValue, setReportedValue] = useState(value);

  if (value !== syncedValue) {
    setSyncedValue(value);
    // When the value prop changes to match what we just reported (the parent
    // echoes back our edit), keep the raw buffer so intermediate states like
    // "1." or "" aren't overwritten. When it changes to anything else (e.g.
    // Reset to Default, external update), force the buffer to match.
    if (value !== reportedValue) {
      setBuffer(formatValue(value));
    }
  }

  return (
    <Input
      type="number"
      value={buffer}
      onChange={e => {
        const parsed = parseNumberSafely(e.target.value);
        setBuffer(e.target.value);
        setReportedValue(parsed);
        onValueChange(parsed);
      }}
      onBlur={() => setBuffer(formatValue(value))}
      {...props}
    />
  );
}

function formatValue(value: number | undefined) {
  return value === undefined ? "" : String(value);
}
