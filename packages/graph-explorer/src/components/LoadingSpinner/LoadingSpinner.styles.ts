import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles =
  (color?: string): ThemeStyleFn =>
  ({ theme }) => css`
    overflow: hidden;
    width: 3rem;
    height: 3rem;

    > div {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      background: transparent;
      position: relative;
      color: ${color ?? theme.palette.primary.contrastText};
    }
  `;

export default defaultStyles;
