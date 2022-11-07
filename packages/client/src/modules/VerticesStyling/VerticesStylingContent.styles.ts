import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx?: string): ThemeStyleFn => ({ theme }) =>
  css`
    height: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    background: ${theme.palette.background.default};

    .${pfx}-items {
      padding: ${theme.spacing["4x"]};
      flex-grow: 1;
      border-bottom: solid 1px ${theme.palette.border};
    }

    .${pfx}-actions {
      display: flex;
      justify-content: flex-start;
      padding: ${theme.spacing["4x"]};
    }
  `;

export default defaultStyles;
