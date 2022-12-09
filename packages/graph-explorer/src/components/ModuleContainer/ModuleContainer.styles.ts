import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    &.${pfx}-module-container {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: ${theme.palette.background.secondary};
      color: ${theme.palette.text.secondary};

      > .${pfx}-content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
      }

      &.${pfx}-variant-default {
        border-radius: 4px;
        box-shadow: ${isDarkTheme ? "none" : theme.shadow.base};
        border: ${isDarkTheme ? `solid 1px ${theme.palette.border}` : "none"};
      }

      &.${pfx}-variant-sidebar {
        border-radius: 0;
        box-shadow: none;
        border: ${isDarkTheme ? `solid 1px ${theme.palette.border}` : "none"};
      }

      &.${pfx}-variant-widget {
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        box-shadow: none;
        border: none;
      }

      .${pfx}-loading {
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
