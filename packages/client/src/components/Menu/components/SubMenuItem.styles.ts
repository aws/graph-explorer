import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";

export const SubmenuParent = (pfx: string): ThemeStyleFn => ({
  theme,
  isDarkTheme,
}) =>
  css`
    &.${pfx}-submenu-parent {
      .${pfx}-list-item-selected {
        background: ${theme.menu?.list?.item?.selected?.background ||
        theme.palette.background.contrast} !important;
        color: ${theme.menu?.list?.item?.selected?.color ||
        theme.palette.text.primary} !important;
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

      .${pfx}-submenu-is-open.${pfx}-list-item {
        background-color: ${isDarkTheme
          ? theme.palette.grey[700]
          : theme.palette.grey[200]};
        .${pfx}-start-adornment,.${pfx}-end-adornment {
          color: ${theme.palette.primary.main};
        }
      }

      .${pfx}-list-item {
        background: ${theme.menu?.list?.item?.background || "transparent"};
        color: ${theme.menu?.list?.item?.color || theme.palette.text.primary};
        font-size: ${theme.menu?.list?.item?.fontSize ||
        theme.typography.sizes.xs};

        &.${pfx}-clickable:hover {
          background-color: ${theme.menu?.list?.item?.hover?.background ||
          theme.palette.background.contrast};
          color: ${theme.menu?.list?.item?.hover?.color ||
          theme.palette.text.primary};
          .${pfx}-start-adornment {
            color: ${theme.menu?.list?.item?.startAdornment?.hover?.color ||
            theme.palette.primary.main};
          }
          ${pfx}-end-adornment {
            color: ${theme.menu?.list?.item?.endAdornment?.hover?.color ||
            theme.palette.primary.main};
          }
        }
      }
    }
  `;
