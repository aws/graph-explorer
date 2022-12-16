import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (): ThemeStyleFn => ({ theme }) =>
  css`
    position: relative;
    display: flex;
    flex-direction: column;
    background: ${theme.palette.background.default};
    height: 100%;
    overflow: auto;
  `;

export default defaultStyles;
