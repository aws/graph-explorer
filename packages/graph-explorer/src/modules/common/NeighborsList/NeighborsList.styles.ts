import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";

const defaultStyles = (pfx?: string): ThemeStyleFn => ({ theme }) =>
  css`
    &.${pfx}-section {
      display: flex;
      flex-direction: column;
      padding: ${theme.spacing["4x"]};
      gap: ${theme.spacing["2x"]};
      border-bottom: solid 1px ${theme.palette.divider};
      height: 30%;
      overflow: auto;

      .${pfx}-title {
        font-weight: bold;
      }

      .${pfx}-node-item {
        display: flex;
        justify-content: space-between;
        margin-top: ${theme.spacing["2x"]};
        gap: ${theme.spacing["2x"]};
        .${pfx}-chip {
          user-select: none;
          min-width: 48px;
          justify-content: center;
        }
        .${pfx}-vertex-type {
          display: flex;
          align-items: center;
          column-gap: ${theme.spacing["2x"]};

          .${pfx}-icon {
            color: ${theme.palette.primary.main};
          }
        }
        .${pfx}-vertex-totals {
          display: flex;
          align-items: flex-end;
          column-gap: ${theme.spacing["2x"]};

          .${pfx}-icon {
            color: ${theme.palette.primary.main};
          }
        }
      }
    }
  `;

export default defaultStyles;
