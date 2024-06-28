import { css } from "@emotion/css";
import { fade, ThemeStyleFn } from "../../core";
import { CheckboxTheme } from "./Checkbox.model";

export const checkboxStyles: ThemeStyleFn<CheckboxTheme> = ({ theme }) => {
  const { forms, checkbox, palette } = theme;
  return css`
    margin-right: 4px;
    cursor: pointer;

    &.checkbox-readonly {
      pointer-events: none;
      cursor: auto;
    }
    &.checkbox-disabled {
      filter: opacity(30%);
      pointer-events: none;
      cursor: not-allowed;
    }

    &.checkbox-selected {
      rect:first-of-type {
        fill: ${checkbox?.checked?.fill || palette.primary.main};
        stroke: ${checkbox?.checked?.stroke || "none"};
      }

      path:first-of-type {
        fill: ${checkbox?.checked?.tickColor || palette.primary.contrastText};
      }
    }

    &.checkbox-indeterminate {
      rect:first-of-type {
        fill: ${checkbox?.indeterminate?.fill || palette.border};
        stroke: ${checkbox?.indeterminate?.stroke || "none"};
      }
    }

    &.checkbox-invalid {
      rect:first-of-type {
        stroke: ${checkbox?.error?.stroke || fade(palette.error.main, 0.7)};
      }
    }
    rect:first-of-type {
      fill: ${checkbox?.fill || "none"};
      stroke: ${checkbox?.stroke || palette.border};
    }

    path:first-of-type {
      fill: ${checkbox?.fill || palette.primary.contrastText};
    }

    rect ~ rect {
      stroke: ${checkbox?.focus?.outlineColor ||
      forms?.focus?.outlineColor ||
      palette.primary.main};
    }
  `;
};

export const labelStyles: ThemeStyleFn<CheckboxTheme> = ({ theme }) => css`
  display: flex;
  align-items: center;
  color: ${theme.checkbox?.label?.color ||
  theme.forms?.label?.color ||
  theme.palette.text.primary};
  &.checkbox-label-invalid {
    color: ${theme.checkbox?.error?.stroke ||
    theme.forms?.error?.labelColor ||
    theme.palette.error.main};
  }
  &.checkbox-label-readonly {
    pointer-events: none;
  }
  &.checkbox-label-disabled {
    cursor: not-allowed;
  }
  cursor: pointer;
`;
