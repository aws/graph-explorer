import { useCallback } from "react";
import { useTheme } from "../../core";
import type { ChipProps } from "./Chip";

const isColorVariant = (
  color: string | undefined
): color is ChipProps["variant"] => {
  if (!color) return false;
  return ["error", "warning", "info", "success"].includes(color);
};

const useChipColor = (
  options: Record<
    string,
    {
      label: string;
      color?: string;
      background?: string;
    }
  >
) => {
  const [{ theme }] = useTheme();

  const getChipColor = useCallback(
    (value: string) => {
      const option = options[value];

      if (!option) return;

      const color = option.color;

      if (color && isColorVariant(color)) {
        return {
          variant: color,
        };
      }

      return {
        color: option?.color || theme.palette.text.primary,
        background: option?.background || theme.palette.background.contrast,
      };
    },
    [options, theme.palette.text.primary, theme.palette.background.contrast]
  );

  return { getChipColor };
};

export default useChipColor;
