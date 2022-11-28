import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => css`
  position: relative;
  width: 100%;
  height: 100%;

  > .${pfx}-details-overlay {
    position: absolute;
    width: 300px;
    max-width: 300px;
    top: 50px;
    left: ${theme.spacing["2x"]};
    bottom: ${theme.spacing["2x"]};
    z-index: 199;
  }
`;

export default defaultStyles;
