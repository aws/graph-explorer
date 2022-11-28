import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";
import { fade } from "../../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    &.${pfx}-context-menu {
      .${pfx}-card-root {
        min-width: 150px;
        max-height: min(500px, 90vh);
        margin: 0;
        padding: 0;
        overflow: auto;
        border: none;
      }

      .${pfx}-title {
        font-weight: ${theme.typography.weight?.bold};
        font-size: ${theme.typography.sizes.xs};
        padding: ${theme.spacing.base} ${theme.spacing["4x"]};
      }

      .${pfx}-list-item {
        &.${pfx}-list-item-header {
          .${pfx}-primary {
            font-weight: ${theme.typography.weight?.bold};
          }
          background: ${fade(theme.palette.primary.main, 0.3)};
        }
        font-size: ${theme.typography.sizes.xs};

        .${pfx}-content {
          min-height: 28px;
          height: 28px;
          padding-right: ${theme.spacing["2x"]};
        }

        .${pfx}-list-item-chip {
          font-size: ${theme.typography.sizes.xs};
          height: 16px;
        }

        .${pfx}-start-adornment {
          font-size: ${theme.typography.sizes.base};
          color: ${theme.palette.text.disabled};
          margin: 0;
        }

        .${pfx}-end-adornment {
          pointer-events: auto;
          color: ${theme.palette.grey[300]};
          min-width: 20px;
          margin-right: 0px;
          svg {
            font-size: ${theme.typography.sizes.xl};
          }
          .${pfx}-active-pin {
            color: ${theme.palette.primary.main};
          }
        }

        .${pfx}-primary-switch {
          margin-left: ${theme.spacing["2x"]};
        }

        &.${pfx}-clickable:hover {
          .${pfx}-start-adornment {
            color: ${theme.palette.primary.main};
          }
        }
      }

      .${pfx}-divider {
        width: 100%;
        height: 1px;
        background-color: ${theme.palette.divider};
      }
      .${pfx}-card-root>.${pfx}-divider:first-child {
        display: none;
      }

      &.${pfx}-card-elevation-3 {
        border: none;
        background-color: transparent;
      }

      .${pfx}-divider + .${pfx}-divider {
        display: none;
      }

      .${pfx}-global-divider:not(:first-child) {
        width: 100%;
        height: 2px;
        margin: ${theme.spacing["2x"]} 0;
        background-color: ${theme.palette.divider};
      }
    }
  `;

export default defaultStyles;
