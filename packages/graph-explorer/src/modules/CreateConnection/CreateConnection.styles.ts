import { css } from "@emotion/css";
import { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = theme => css`
  .content {
    background: ${theme.palette.background.default};
  }

  .top-bar-title {
    font-weight: bold;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    padding-top: ${theme.spacing["4x"]};
    border-top: solid 1px ${theme.palette.divider};
  }
`;

export default defaultStyles;
