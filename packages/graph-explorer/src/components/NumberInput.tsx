import { useState } from "react";

import { parseNumberSafely } from "@/utils/parseNumberSafely";

import { Input, type InputProps } from "./Input";

export interface NumberInputProps extends Omit<
  InputProps,
  "type" | "value" | "onChange"
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

  // Resync the buffer when the value changes externally (e.g. reset to
  // default), but not when the change is our own edit echoing back.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (parseNumberSafely(buffer) !== value) {
      setBuffer(formatValue(value));
    }
  }

  return (
    <Input
      type="number"
      value={buffer}
      onChange={e => {
        setBuffer(e.target.value);
        onValueChange(parseNumberSafely(e.target.value));
      }}
      onBlur={() => setBuffer(formatValue(value))}
      {...props}
    />
  );
}

function formatValue(value: number | undefined) {
  return value === undefined ? "" : String(value);
}
