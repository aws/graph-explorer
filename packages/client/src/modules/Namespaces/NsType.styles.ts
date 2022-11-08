import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => css`
  height: 100%;
  display: flex;
  flex-direction: column;

  .${pfx}-advanced-list {
    background: ${theme.palette.background.default};
    section > .${pfx}-content {
      padding: 0 ${theme.spacing["4x"]};
    }
  }

  .${pfx}-actions {
    background: ${theme.palette.background.default};
    display: flex;
    justify-content: flex-end;
    padding: ${theme.spacing["2x"]};
    border-top: solid 1px ${theme.palette.divider};
  }
`;

export default defaultStyles;
