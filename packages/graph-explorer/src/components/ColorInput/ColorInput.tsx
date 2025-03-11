import { cn } from "@/utils";
import { ColorPicker, ColorPickerProps } from "@mantine/core";
import { useEffect, useState } from "react";
import {
  InputField,
  InputProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components";

const validHexColorRegex = /^#([0-9a-f]{3}){1,2}$/i;

export interface ColorInputProps
  extends Pick<InputProps, "label" | "labelPlacement">,
    ColorPickerProps {
  startColor?: string;
  onChange(color: string): void;
}

function ColorInput({
  className,
  startColor = "#128ee5",
  onChange,
  label,
  labelPlacement,
  ...props
}: ColorInputProps) {
  const [lastColor, setLastColor] = useState<string>(startColor);
  const [color, setColor] = useState<string>(startColor);

  if (lastColor !== startColor) {
    setLastColor(startColor);
    setColor(startColor);
  }

  useEffect(() => {
    if (
      startColor !== color &&
      lastColor === startColor &&
      validHexColorRegex.test(color)
    ) {
      onChange(color);
    }
  }, [startColor, color, lastColor, onChange]);

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
            noMargin
            hideError
            onChange={(newColor: string) => setColor(newColor)}
          />
          <div
            className="pointer-events-none absolute inset-y-2.5 right-2.5 aspect-square rounded"
            style={{
              backgroundColor: startColor,
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start">
        <ColorPicker
          onChange={(newColor: string) => setColor(newColor)}
          value={color}
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}

export default ColorInput;
