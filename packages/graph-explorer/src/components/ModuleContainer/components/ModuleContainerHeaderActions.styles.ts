import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";
import { fade } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme, isDarkTheme }) => css`
  &.module-container-header-actions {
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  &.module-container-header-actions > * {
    margin-right: ${theme.spacing.base};
  }

  &.module-container-header-actions button {
    color: ${isDarkTheme ? theme.palette.grey[200] : theme.palette.grey[800]};
  }

  &.module-container-header-actions button:hover {
    color: ${theme.palette.primary.main};
  }

  &.module-container-header-actions button:focus-visible {
    color: ${theme.palette.primary.main};
    background-color: ${fade(theme.palette.primary.main, 0.2)};
  }

  &.module-container-header-actions button:disabled {
    color: ${theme.palette.grey[500]};
  }
`;

export default defaultStyles;

export const buttonMenuListItem: ThemeStyleFn = ({ theme }) => css`
  font-size: ${theme.typography.sizes?.xs};
  padding-right: ${theme.spacing["2x"]};

  .content {
    min-height: 28px;
    height: 28px;
  }
`;
