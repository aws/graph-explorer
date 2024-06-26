import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";
import { fade } from "../../../core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  &.navbar-logo {
    position: relative;
    background-color: ${theme.navBar?.header ||
    fade(theme.palette.primary.dark, 0.5)};
    height: 100%;
    margin-right: ${theme.spacing["2x"]};

    .navbar-logo-container {
      transition: ${theme.navBar?.animation?.toggleMenuSpeed || "400ms"};
      height: 100%;
      aspect-ratio: 1/1;
      overflow: hidden;
      background-color: ${theme.palette.primary.dark};
    }

    .hide-logo {
      transition: ${theme.navBar?.animation?.toggleMenuSpeed || "400ms"};
      aspect-ratio: 1/1000;
      opacity: 0;
    }

    .logo {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: ${theme.palette.primary.contrastText};
    }

    .menu-logo {
      position: absolute;
      height: 100%;
      width: 100%;
      font-size: 30px;
      background-color: ${theme.palette.primary.main};
      color: ${theme.palette.primary.contrastText};
      opacity: 0;
      transition: ${theme.navBar?.animation?.toggleMenuSpeed || "400ms"};
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .menu-logo:hover {
      cursor: pointer;
      opacity: 1;
    }
  }
`;

export default defaultStyles;
