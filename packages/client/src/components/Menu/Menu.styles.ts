import { css } from "@emotion/css";
import { ThemeStyleFn } from "../../core";

const rootStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    .${pfx}-card-root {
      min-width: 130px;
      max-height: min(500px, 90vh);
      margin: 0;
      padding: 0;
      overflow: auto;
    }

    .${pfx}-title {
      font-weight: bold;
      font-size: ${theme.menu?.title?.fontSize || theme.typography.sizes.xs};
      padding: ${theme.menu?.title?.padding || theme.spacing.base};
    }

    .${pfx}-divider {
      width: 100%;
      height: 1px;
      background-color: ${theme.palette.divider};
    }

    &.${pfx}-card-elevation-3 {
      border: none;
      background-color: transparent;
    }
  `;

const listItemStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    &.${pfx}-menu-list-item {
      .${pfx}-title {
        font-weight: bold;
        font-size: ${theme.menu?.title?.fontSize || theme.typography.sizes.xs};
        padding: ${theme.menu?.title?.padding || theme.spacing.base + " 0"};
      }

      &.${pfx}-list-item-selected {
        background: ${theme.menu?.list?.item?.selected?.background ||
        theme.palette.background.contrast};
        color: ${theme.menu?.list?.item?.selected?.color ||
        theme.palette.text.primary};
        .${pfx}-list-item {
          background: transparent;
        }
      }

      .${pfx}-disabled {
        opacity: ${theme.menu?.list?.item?.disabled?.opacity || "0.5"};
        background-color: ${theme.menu?.list?.item?.disabled?.background ||
        "inherit"};
        color: ${theme.menu?.list?.item?.disabled?.color || "inherit"};
      }

      .${pfx}-list-item {
        background: ${theme.menu?.list?.item?.background || "transparent"};
        color: ${theme.menu?.list?.item?.color || theme.palette.text.primary};
        font-size: ${theme.menu?.list?.item?.fontSize ||
        theme.typography.sizes.xs};
        .${pfx}-content {
          min-height: 28px !important;
          padding: 0 ${theme.spacing["base"]};
          color: ${theme.menu?.list?.item?.color || theme.palette.text.primary};
          .${pfx}-primary {
            color: ${theme.menu?.list?.item?.color ||
            theme.palette.text.primary};
          }
        }

        .${pfx}-start-adornment {
          font-size: ${theme.menu?.list?.item?.startAdornment?.size ||
          theme.typography.sizes.base};
          color: ${theme.menu?.list?.item?.startAdornment?.color ||
          theme.palette.text.disabled};
          margin: 0;
        }

        .${pfx}-end-adornment {
          pointer-events: auto;
          color: ${theme.menu?.list?.item?.endAdornment?.color ||
          theme.palette.grey[300]};
          min-width: 20px;
          margin: 0;
          svg {
            font-size: ${theme.menu?.list?.item?.endAdornment?.size ||
            theme.typography.sizes.xl};
            margin: 0;
          }
        }

        &.${pfx}-clickable:hover {
          background-color: ${theme.menu?.list?.item?.hover?.background ||
          theme.palette.background.contrast};
          color: ${theme.menu?.list?.item?.hover?.color ||
          theme.palette.text.primary};
          .${pfx}-start-adornment {
            color: ${theme.menu?.list?.item?.startAdornment?.hover?.color ||
            theme.palette.primary.main};
          }
          .${pfx}-end-adornment {
            color: ${theme.menu?.list?.item?.endAdornment?.hover?.color ||
            theme.palette.primary.main};
          }
        }
      }

      .${pfx}-menu-divider {
        width: 100%;
        height: 1px;
        background-color: ${theme.menu?.list?.divider?.color ||
        theme.palette.divider};
      }
      .${pfx}-card-root>.${pfx}-menu-divider:first-child {
        display: none;
      }

      .${pfx}-menu-divider + .${pfx}-menu-divider {
        display: none;
      }
    }
  `;

const styles = { rootStyles, listItemStyles };

export default styles;
