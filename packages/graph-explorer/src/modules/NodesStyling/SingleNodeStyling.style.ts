import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => css`
  display: flex;
  flex-direction: column;
  background: ${theme.palette.background.default};
  gap: ${theme.spacing["2x"]};
  padding: ${theme.spacing["2x"]} ${theme.spacing["4x"]};
  border-bottom: solid 1px ${theme.palette.divider};

  &:last-of-type {
    border-bottom: none;
  }

  .${pfx}-title {
    display: flex;
    justify-content: space-between;
    gap: ${theme.spacing["2x"]};
    .${pfx}-edge-name {
      margin-bottom: ${theme.spacing.base};
      max-width: 80%;
      word-break: break-word;
    }
  }

  .${pfx}-label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${theme.spacing["2x"]};

    .${pfx}-label-display {
      width: 100%;
    }
  }
`;

export default defaultStyles;
