import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  display: contents;
  height: 100%;
  background: ${theme.palette.background.default};

  .header-children {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-right: ${theme.spacing["2x"]};
  }

  .item-switch {
    display: flex;
    min-width: 100px;
    justify-content: flex-end;
  }
`;

export default defaultStyles;
