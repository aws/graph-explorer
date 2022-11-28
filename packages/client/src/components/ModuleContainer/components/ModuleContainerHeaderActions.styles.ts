import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";
import { fade } from "../../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    &.${pfx}-module-container-header-actions {
      height: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    &.${pfx}-module-container-header-actions > * {
      margin-right: ${theme.spacing.base};
    }

    &.${pfx}-module-container-header-actions button {
      color: ${isDarkTheme ? theme.palette.grey[200] : theme.palette.grey[800]};
    }

    &.${pfx}-module-container-header-actions button:hover {
      color: ${theme.palette.primary.main};
    }

    &.${pfx}-module-container-header-actions button:focus {
      color: ${theme.palette.primary.main};
      background-color: ${fade(theme.palette.primary.main, 0.2)};
    }

    &.${pfx}-module-container-header-actions button:disabled {
      color: ${theme.palette.grey[500]};
    }
  `;

export default defaultStyles;

export const buttonMenuListItem = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    font-size: ${theme.typography.sizes?.xs};
    padding-right: ${theme.spacing["2x"]};

    .${pfx}-content {
      min-height: 28px;
      height: 28px;
    }
  `;
