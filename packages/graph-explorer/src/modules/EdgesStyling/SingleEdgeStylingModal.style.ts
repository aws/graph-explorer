import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  div[role="presentation"] > div {
    margin-top: auto;
    margin-left: auto;
    margin-bottom: 0;
  }
  .modal-container {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing["4x"]};

    .attrs-container {
      display: flex;
      justify-content: space-between;
      gap: ${theme.spacing["2x"]};

      > * {
        flex-grow: 1;
        width: 100%;
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      padding-top: ${theme.spacing["2x"]};
      border-top: solid 1px ${theme.palette.divider};
    }
  }
`;

export default defaultStyles;
