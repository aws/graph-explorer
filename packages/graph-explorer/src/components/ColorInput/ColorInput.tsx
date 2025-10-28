import { cn } from "@/utils";
import type { ComponentPropsWithoutRef } from "react";
import {
  InputField,
  type InputFieldProps,
  inputStyles,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";
import { HexColorPicker, HexColorInput } from "react-colorful";

export interface ColorInputProps
  extends Pick<InputFieldProps, "label" | "labelPlacement">,
    ComponentPropsWithoutRef<typeof HexColorPicker> {}

const DEFAULT_COLOR = "#128ee5";

function ColorInput({
  className,
  color = DEFAULT_COLOR,
  onChange,
  label,
  labelPlacement,
  ...props
}: ColorInputProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <InputField
            label={label}
            labelPlacement={labelPlacement}
            aria-label="color-input"
            type="text"
            value={color}
            isReadOnly
          />
          <div
            className="pointer-events-none absolute inset-y-2 right-2 aspect-square rounded"
            style={{
              backgroundColor: color,
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="space-y-4">
        <HexColorInput
          color={color}
          onChange={onChange}
          className={cn(inputStyles())}
          autoFocus
        />
        <HexColorPicker onChange={onChange} color={color} {...props} />
      </PopoverContent>
    </Popover>
  );
}

export default ColorInput;
