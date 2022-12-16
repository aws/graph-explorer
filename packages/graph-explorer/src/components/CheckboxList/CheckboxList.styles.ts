import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    &.${pfx}-checkbox-list {
      display: flex;
      flex-grow: 1;
      flex-direction: column;
      width: 100%;
      height: 100%;

      .${pfx}-title {
        padding: ${theme.spacing["2x"]} 0;
        font-weight: bold;
        font-size: ${theme.typography.sizes.xs};
      }

      .${pfx}-content {
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: auto;
        row-gap: ${theme.spacing["2x"]};
        padding: ${theme.spacing["2x"]} 0 0;
        border: solid 1px ${theme.palette.border};
        border-radius: ${theme.shape.borderRadius};
        margin-bottom: ${theme.spacing["4x"]};
      }

      .${pfx}-checkbox-container {
        padding: 0 ${theme.spacing["2x"]};
      }
      .${pfx}-checkbox {
        svg {
          min-width: 28px;
        }
      }

      .${pfx}-checkbox-content {
        user-select: none;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        word-break: break-word;
        gap: ${theme.spacing["2x"]};
      }

      .${pfx}-icon {
        > svg {
          width: 16px;
          height: 16px;
          color: ${theme.palette.primary.main};
        }
      }

      .${pfx}-selector {
        user-select: none;
        position: sticky;
        bottom: 0;
        background: ${isDarkTheme
          ? theme.palette.background.secondary
          : theme.palette.background.default};
        border-top: solid 1px ${theme.palette.border};
        padding-top: ${theme.spacing.base};
      }
    }
  `;

export default defaultStyles;
