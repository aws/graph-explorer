import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: ${theme.shape.borderRadius};
    box-shadow: ${isDarkTheme ? "none" : theme.shadow.base};
    border: ${isDarkTheme ? `solid 1px ${theme.palette.border}` : "none"};
    background: ${theme.palette.background.default} !important;
    color: ${theme.palette.text.primary} !important;

    > * {
      margin: 0 ${theme.spacing["2x"]};

      :first-child {
        margin-left: 0;
      }

      :last-child {
        margin-right: 0;
      }
    }

    .${pfx}-main {
      display: flex;
      min-width: 180px;
      height: 100%;
      align-items: center;

      .${pfx}-main-content {
        padding: 0 ${theme.spacing["2x"]};
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }

    .${pfx}-start-adornment {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-size: ${theme.typography.sizes.xl};
      min-width: 36px;
      height: 36px;
      border-radius: 24px;
      color: ${theme.palette.primary.main};
      background: ${fade(theme.palette.primary.main, 0.2)};
    }

    .${pfx}-container {
      height: 100%;
      display: flex;
      flex-grow: 1;
      flex-direction: column;
      justify-content: center;
      padding-right: ${theme.spacing["2x"]};
      border-right: solid 1px ${theme.palette.border};

      :last-child {
        border-right: none;
      }
    }

    .${pfx}-title {
      font-weight: ${theme.typography.weight.bold};
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-all;
    }
    .${pfx}-subtitle {
      font-size: ${theme.typography.sizes.xs};
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-all;
    }

    .${pfx}-children-container {
      width: 100%;
      display: flex;
      align-items: center;
    }
  `;

export default defaultStyles;
