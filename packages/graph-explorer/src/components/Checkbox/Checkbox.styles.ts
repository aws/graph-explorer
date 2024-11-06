import { css } from "@emotion/css";
import { fade, ThemeStyleFn } from "@/core";

export const checkboxStyles: ThemeStyleFn = ({ theme }) => {
  const { forms, palette } = theme;
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
        fill: ${palette.primary.main};
        stroke: none;
      }

      path:first-of-type {
        fill: ${palette.primary.contrastText};
      }
    }

    &.checkbox-indeterminate {
      rect:first-of-type {
        fill: ${palette.border};
        stroke: none;
      }
    }

    &.checkbox-invalid {
      rect:first-of-type {
        stroke: ${fade(palette.error.main, 0.7)};
      }
    }
    rect:first-of-type {
      fill: none;
      stroke: ${palette.border};
    }

    path:first-of-type {
      fill: ${palette.primary.contrastText};
    }

    rect ~ rect {
      stroke: ${forms?.focus?.outlineColor || palette.primary.main};
    }
  `;
};

export const labelStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  align-items: center;
  color: ${theme.forms?.label?.color || theme.palette.text.primary};
  &.checkbox-label-invalid {
    color: ${theme.forms?.error?.labelColor || theme.palette.error.main};
  }
  &.checkbox-label-readonly {
    pointer-events: none;
  }
  &.checkbox-label-disabled {
    cursor: not-allowed;
  }
  cursor: pointer;
`;
