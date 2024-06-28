import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles: ThemeStyleFn = ({ theme, isDarkTheme }) => css`
  &.module-container {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: ${theme.palette.background.secondary};
    color: ${theme.palette.text.secondary};

    > .content {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: hidden;
    }

    &.variant-default {
      border-radius: 4px;
      box-shadow: ${isDarkTheme ? "none" : theme.shadow.base};
      border: ${isDarkTheme ? `solid 1px ${theme.palette.border}` : "none"};
    }

    &.variant-sidebar {
      border-radius: 0;
      box-shadow: none;
      border: ${isDarkTheme ? `solid 1px ${theme.palette.border}` : "none"};
    }

    &.variant-widget {
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      box-shadow: none;
      border: none;
    }

    .loading {
      display: flex;
      height: 100%;
      justify-content: center;
      align-items: center;

      svg {
        width: 48px;
        height: 48px;
      }
    }
  }
`;

export default defaultStyles;
