import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx?: string): ThemeStyleFn => ({ theme }) => css`
  height: 100%;
  display: flex;
  flex-direction: column;

  .${pfx}-add-prefix-container {
    display: flex;
    align-items: center;
    gap: ${theme.spacing["2x"]};
    margin-top: ${theme.spacing["4x"]};
    padding-top: ${theme.spacing["4x"]};
    border-top: solid 1px ${theme.palette.divider};

    .${pfx}-input-uri {
      flex-grow: 1;
    }
  }
`;

export default defaultStyles;
