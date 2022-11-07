import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { NavBarTheme } from "./NavBar.model";

const defaultStyles = (pfx: string): ThemeStyleFn<NavBarTheme> => ({ theme }) =>
  css`
    &.${pfx}-navbar-item {
      .${pfx}-handler {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        justify-content: flex-start;
      }

      .${pfx}-handler-enabled {
        padding-right: ${theme.spacing["2x"]};
      }

      .${pfx}-icon {
        margin-left: ${theme.spacing["3x"]};
        color: ${theme.navBar?.iconColor ||
        theme.navBar?.color ||
        theme.palette.common.white};
        font-size: 20px;
      }

      .${pfx}-title {
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-left: ${theme.spacing["2x"]};
        line-height: 50px;
      }

      .${pfx}-handler-enabled:hover {
        background-color: ${theme.navBar?.hover || theme.palette.primary.dark};
        color: ${theme.navBar?.color || theme.palette.common.white};
        cursor: pointer;
      }

      .${pfx}-is-active {
        background-color: ${theme.navBar?.activeBackground ||
        theme.palette.primary.light};
        color: ${theme.navBar?.activeColor || theme.palette.common.white};
      }

      .${pfx}-is-open-and-active {
        background-color: ${theme.navBar?.hover || theme.palette.primary.dark};
        color: ${theme.navBar?.color || theme.palette.common.white};
      }

      .${pfx}-arrow-icon {
        margin-left: auto;
        color: ${theme.navBar?.iconColor ||
        theme.navBar?.color ||
        theme.palette.common.white};
      }

      .${pfx}-arrow-icon-open {
        transform: rotate(90deg);
      }
    }
  `;

export default defaultStyles;
