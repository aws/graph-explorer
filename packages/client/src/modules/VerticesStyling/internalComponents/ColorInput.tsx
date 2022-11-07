import { ColorPicker, ColorPickerProps } from "@mantine/core";
import { FC, useEffect, useState } from "react";
import {
  Input,
  UseLayer,
  UseLayerOverlay,
  UseLayerTrigger,
} from "../../../components";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import defaultStyles, { colorPickerStyle } from "./ColorInput.style";

const validHexColorRegex = /^#([0-9a-f]{3}){1,2}$/i;

export type ColorInputProps = {
  classNamePrefix?: string;
  startColor?: string;
  onChange(color: string): void;
};

const ColorInput: FC<ColorInputProps & ColorPickerProps> = ({
  classNamePrefix = "ft",
  startColor = "#128ee5",
  onChange,
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
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("color-input")}>
        <UseLayer
          onClose={() => setColorPickerOpen(false)}
          isOpen={colorPickerOpen}
          placement={"bottom-start"}
        >
          <UseLayerTrigger>
            <Input
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
            <div className={styleWithTheme(colorPickerStyle(classNamePrefix))}>
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
