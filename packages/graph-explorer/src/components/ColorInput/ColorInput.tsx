import { cx } from "@emotion/css";
import { ColorPicker, ColorPickerProps } from "@mantine/core";
import { FC, useEffect, useState } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import {
  Input,
  InputProps,
  UseLayer,
  UseLayerOverlay,
  UseLayerTrigger,
} from "../index";
import defaultStyles, { colorPickerStyle } from "./ColorInput.style";

const validHexColorRegex = /^#([0-9a-f]{3}){1,2}$/i;

export type ColorInputProps = Pick<InputProps, "label" | "labelPlacement"> & {
  classNamePrefix?: string;
  startColor?: string;
  onChange(color: string): void;
};

const ColorInput: FC<ColorInputProps & ColorPickerProps> = ({
  classNamePrefix = "ft",
  className,
  startColor = "#128ee5",
  onChange,
  label,
  labelPlacement,
  ...props
}) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const [lastColor, setLastColor] = useState<string>(startColor);
  const [color, setColor] = useState<string>(startColor);
  const [colorPickerOpen, setColorPickerOpen] = useState<boolean>(false);

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
    <div
      className={cx(styleWithTheme(defaultStyles(classNamePrefix)), className)}
    >
      <div className={pfx("color-input")}>
        <UseLayer
          onClose={() => setColorPickerOpen(false)}
          isOpen={colorPickerOpen}
          placement={"bottom-start"}
        >
          <UseLayerTrigger>
            <Input
              label={label}
              labelPlacement={labelPlacement}
              aria-label="color-input"
              classNamePrefix={classNamePrefix}
              className={pfx("input")}
              onClick={() => setColorPickerOpen(true)}
              type={"text"}
              value={color}
              onChange={(newColor: string) => setColor(newColor)}
              endAdornment={
                <div
                  onClick={() => setColorPickerOpen(true)}
                  style={{
                    backgroundColor: startColor,
                    height: "60%",
                    aspectRatio: "1",
                    borderRadius: "4px",
                  }}
                />
              }
            />
          </UseLayerTrigger>
          <UseLayerOverlay>
            <div className={styleWithTheme(colorPickerStyle())}>
              <ColorPicker
                onChange={(newColor: string) => setColor(newColor)}
                value={color}
                {...props}
              />
            </div>
          </UseLayerOverlay>
        </UseLayer>
      </div>
    </div>
  );
};

export default ColorInput;
