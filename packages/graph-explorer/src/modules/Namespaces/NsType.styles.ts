import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  height: 100%;
  display: flex;
  flex-direction: column;

  .advanced-list {
    background: ${theme.palette.background.default};
    section > .content {
      padding: 0 ${theme.spacing["4x"]};
    }
  }

  .actions {
    background: ${theme.palette.background.default};
    display: flex;
    justify-content: flex-end;
    padding: ${theme.spacing["2x"]};
    border-top: solid 1px ${theme.palette.divider};
  }
`;

export default defaultStyles;
