import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";
import { fade } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  &.context-menu {
    .card-root {
      min-width: 150px;
      max-height: min(500px, 90vh);
      margin: 0;
      padding: 0;
      overflow: auto;
      border: none;
    }

    .title {
      font-weight: ${theme.typography.weight?.bold};
      font-size: ${theme.typography.sizes.base};
      padding: ${theme.spacing.base} ${theme.spacing["4x"]};
    }

    .context-menu-list-item {
      &.list-item-header {
        .primary {
          font-weight: ${theme.typography.weight?.bold};
        }
        background: ${fade(theme.palette.primary.main, 0.3)};
      }
      font-size: ${theme.typography.sizes.base};

      .content {
        min-height: 28px;
        height: 32px;
        padding-right: ${theme.spacing["2x"]};
      }

      .list-item-chip {
        font-size: ${theme.typography.sizes.base};
        height: 16px;
      }

      .start-adornment {
        font-size: ${theme.typography.sizes.xl};
        color: ${theme.palette.text.disabled};
        margin: 0;
      }

      .end-adornment {
        pointer-events: auto;
        color: ${theme.palette.grey[300]};
        min-width: 20px;
        margin-right: 0px;
        svg {
          font-size: ${theme.typography.sizes.xl};
        }
        .active-pin {
          color: ${theme.palette.primary.main};
        }
      }

      .primary-switch {
        margin-left: ${theme.spacing["2x"]};
      }

      &.clickable:hover {
        .start-adornment {
          color: ${theme.palette.primary.main};
        }
      }
    }

    .divider {
      width: 100%;
      height: 1px;
      background-color: ${theme.palette.divider};
    }
    .card-root > .divider:first-child {
      display: none;
    }

    &.card-elevation-3 {
      border: none;
      background-color: transparent;
    }

    .divider + .divider {
      display: none;
    }

    .global-divider:not(:first-child) {
      width: 100%;
      height: 2px;
      margin: ${theme.spacing["2x"]} 0;
      background-color: ${theme.palette.divider};
    }
  }
`;

export default defaultStyles;
