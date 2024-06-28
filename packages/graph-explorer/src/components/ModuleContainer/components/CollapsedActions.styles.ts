import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";

const defaultStyles: ThemeStyleFn = ({ theme, isDarkTheme }) => css`
  &.collapsed-actions,
  &.submenu {
    padding: 0;
    margin: 0;
    border-radius: ${theme.shape.borderRadius};

    .divider {
      width: 60%;
      height: 1px;
      background: ${theme.palette.divider};
      margin: ${theme.spacing["2x"]} auto;
    }

    .list-item {
      border-radius: ${theme.shape.borderRadius};
      font-size: ${theme.typography.sizes.xs};
      padding-right: ${theme.spacing["2x"]};

      .start-adornment,
      .end-adornment {
        font-size: ${theme.typography.sizes.lg};
        color: ${theme.palette.grey[600]};
      }

      .content {
        min-height: 28px;
        height: 28px;
      }

      .end-adornment {
        min-width: 20px;
        margin-right: 0px;
      }

      &.clickable:hover {
        .start-adornment,
        .end-adornment {
          color: ${theme.palette.primary.main};
        }
      }
      &.submenu-is-open {
        background-color: ${isDarkTheme
          ? theme.palette.grey[700]
          : theme.palette.grey[200]};
        .start-adornment,
        .end-adornment {
          color: ${theme.palette.primary.main};
        }
      }
    }
  }
`;

export default defaultStyles;
