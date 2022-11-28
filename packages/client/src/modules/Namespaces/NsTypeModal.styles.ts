import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => css`
  .${pfx}-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: ${theme.spacing["2x"]};
    border-top: solid 1px ${theme.palette.divider};
  }
`;

export default defaultStyles;
