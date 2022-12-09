import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    &.${pfx}-collapsed-actions, &.${pfx}-submenu {
      padding: 0;
      margin: 0;
      border-radius: ${theme.shape.borderRadius};

      .${pfx}-divider {
        width: 60%;
        height: 1px;
        background: ${theme.palette.divider};
        margin: ${theme.spacing["2x"]} auto;
      }

      .${pfx}-list-item {
        border-radius: ${theme.shape.borderRadius};
        font-size: ${theme.typography.sizes.xs};
        padding-right: ${theme.spacing["2x"]};

        .${pfx}-start-adornment, .${pfx}-end-adornment {
          font-size: ${theme.typography.sizes.lg};
          color: ${theme.palette.grey[600]};
        }

        .${pfx}-content {
          min-height: 28px;
          height: 28px;
        }

        .${pfx}-end-adornment {
          min-width: 20px;
          margin-right: 0px;
        }

        &.${pfx}-clickable:hover {
          .${pfx}-start-adornment, .${pfx}-end-adornment {
            color: ${theme.palette.primary.main};
          }
        }
        &.${pfx}-submenu-is-open {
          background-color: ${isDarkTheme
            ? theme.palette.grey[700]
            : theme.palette.grey[200]};
          .${pfx}-start-adornment, .${pfx}-end-adornment {
            color: ${theme.palette.primary.main};
          }
        }
      }
    }
  `;

export default defaultStyles;
