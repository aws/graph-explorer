import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    &.${pfx}-module-container-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      min-height: 42px;
      padding: 0 ${theme.spacing["3x"]};
      border-top: solid 1px ${theme.palette.border};
      background-color: ${theme.palette.background.default};
      color: ${theme.palette.text.primary};

      &.${pfx}-single-child {
        justify-content: flex-end;
      }
    }
  `;

export default defaultStyles;
