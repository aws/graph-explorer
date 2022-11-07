import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";
import type { NavBarTheme } from "./NavBar.model";

const NAV_WIDTH = "240px";

const defaultStyles = (pfx: string): ThemeStyleFn<NavBarTheme> => ({ theme }) =>
  css`
    &.${pfx}-navigation-bar {
      font-family: ${theme.typography.fontFamily};

      .${pfx}-navbar {
        width: ${NAV_WIDTH};
        height: 100vh;
        position: relative;
        margin-left: -${NAV_WIDTH};
        transition: margin-left
          ${theme.navBar?.animation?.toggleMenuSpeed || "0.2s"};
      }

      .${pfx}-navigation-bar-open {
        margin-left: 0;
      }

      .${pfx}-navigation-content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        background-color: ${theme.navBar?.background ||
        theme.palette.primary.dark};
        color: ${theme.navBar?.color || theme.palette.primary.contrastText};
        height: 100%;
        max-height: 100vh;
        overflow: hidden;
      }

      .${pfx}-hide-navigation-button {
        position: absolute;
        display: block;
        top: 13px;
        right: ${theme.spacing.base};
        z-index: ${theme.zIndex.modal - 1};
      }

      .${pfx}-hide-navigation-icon {
        transform: rotate(180deg);
        background-color: ${theme.navBar?.closeButton?.background ||
        theme.palette.primary.dark};
        color: ${theme.navBar?.closeButton?.color ||
        theme.navBar?.color ||
        theme.palette.common.white};
      }

      .${pfx}-hide-navigation-icon:hover {
        background-color: ${theme.palette.primary.main};
      }

      .${pfx}-header {
        flex-shrink: 0;
        background-color: ${theme.navBar?.header ||
        fade(theme.palette.primary.dark, 0.5)};
      }

      .${pfx}-header.logo {
        height: 52px;
        display: flex;
        align-items: center;
      }

      .${pfx}-header.logo div {
        margin: auto;
      }

      .${pfx}-footer {
        margin-top: auto;
        flex-shrink: 0;
      }

      .${pfx}-scrollable {
        overflow-y: auto;
      }

      .${pfx}-scrollable::-webkit-scrollbar {
        width: 8px;
      }

      .${pfx}-scrollable::-webkit-scrollbar-thumb {
        background-color: ${theme.navBar?.scrollbar ||
        theme.palette.primary.dark};
        border-radius: 10px;
        width: 5px;
        border-right: 3px solid
          ${theme.navBar?.background || theme.palette.primary.dark};
        background-clip: padding-box;
      }

      .${pfx}-separator {
        margin: 0;
        border: 0;
        height: 1px;
        background-color: ${theme.navBar?.separator ||
        theme.palette.primary.contrastText};
      }

      .${pfx}-sticky {
        flex-shrink: 0;
      }

      @media (max-width: 1024px) {
        .${pfx}-navbar {
          position: absolute;
          z-index: ${theme.zIndex.modal - 2};
        }
      }
    }
  `;

export default defaultStyles;
