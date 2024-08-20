import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  &.section {
    display: flex;
    flex-direction: column;
    padding: ${theme.spacing["4x"]} ${theme.spacing["3x"]};
    gap: ${theme.spacing["2x"]};
    border-bottom: solid 1px ${theme.palette.divider};

    .title {
      font-weight: bold;
    }

    .node-item {
      display: flex;
      justify-content: space-between;
      margin-top: ${theme.spacing["2x"]};
      gap: ${theme.spacing["2x"]};
      .chip {
        user-select: none;
        min-width: 48px;
        justify-content: center;
      }
      .vertex-type {
        display: flex;
        align-items: center;
        column-gap: ${theme.spacing["2x"]};

        .icon {
          color: ${theme.palette.primary.main};
        }
      }
      .vertex-totals {
        display: flex;
        align-items: flex-end;
        column-gap: ${theme.spacing["2x"]};

        .icon {
          color: ${theme.palette.primary.main};
        }
      }
    }
  }
`;

export default defaultStyles;
