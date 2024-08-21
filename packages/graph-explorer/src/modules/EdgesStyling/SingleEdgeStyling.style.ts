import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.base};

  .title {
    display: flex;
    justify-content: space-between;
    gap: ${theme.spacing["2x"]};
    .edge-name {
      margin-bottom: ${theme.spacing.base};
      max-width: 80%;
      word-break: break-word;
    }
  }

  .label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${theme.spacing["2x"]};

    .label-display {
      width: 100%;
    }
  }
`;

export default defaultStyles;
