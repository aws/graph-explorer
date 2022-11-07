import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core/ThemeProvider/types";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => {
  const { palette } = theme;

  return css`
    &.${pfx}-entities-tabular-module {
      position: relative;
      width: 100%;
      height: 100%;
      flex-grow: 1;

      > .${pfx}-card-root {
        position: relative;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: ${palette.background.secondary};
        border: solid 1px ${palette.border};
      }
    }
  `;
};

export default defaultStyles;
