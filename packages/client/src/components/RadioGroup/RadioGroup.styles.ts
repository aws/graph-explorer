import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";
import type { RadioGroupTheme } from "./RadioGroup.model";

export const radioLabelStyles = (
  pfx: string
): ThemeStyleFn<RadioGroupTheme> => ({ theme }) => {
  const { radio, palette } = theme;
  return css`
    color: ${radio?.label?.color || palette.text.primary};
    cursor: pointer;
    &.${pfx}-radio-label-readonly, &.${pfx}-radio-label-disabled {
      pointer-events: none;
    }
  `;
};

export const radioGroupLabelStyles = (): ThemeStyleFn<RadioGroupTheme> => ({
  theme,
}) => {
  const { radio, palette } = theme;

  return css`
    color: ${radio?.label?.color || palette.text.primary};
  `;
};

export const radioStyles = (pfx: string): ThemeStyleFn<RadioGroupTheme> => ({
  theme,
}) => {
  const { forms, radio, palette } = theme;
  return css`
    margin-right: 4px;
    cursor: pointer;
    &.${pfx}-radio-readonly {
      pointer-events: none;
      cursor: auto;
    }

    &.${pfx}-radio-disabled {
      filter: opacity(
        ${radio?.disabledOpacity || forms?.disabledOpacity || "70%"}
      );
      pointer-events: none;
    }

    circle:first-of-type {
      stroke: ${radio?.stroke || palette.grey["400"]};
    }

    &.${pfx}-radio-selected {
      circle:first-of-type {
        fill: ${radio?.selected?.fill || "none"};
      }

      .indicator {
        fill: ${radio?.selected?.indicatorColor || palette.primary.main};
      }
    }

    &.${pfx}-radio-invalid {
      circle:first-of-type {
        stroke: ${radio?.error?.stroke || fade(palette.error.main, 0.7)};
      }
    }

    .${pfx}-radio-focused {
      stroke: ${radio?.focus?.outlineColor ||
      forms?.focus?.outlineColor ||
      radio?.selected?.fill ||
      palette.primary.main};
    }
  `;
};
