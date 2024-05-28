import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import fade from "../../core/ThemeProvider/utils/fade";

const defaultStyles =
  (pfx?: string): ThemeStyleFn =>
  ({ theme }) => css`
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${theme.palette.background.default};

    .${pfx}-empty-panel-state {
      height: auto;
      flex-grow: 1;
    }
    .${pfx}-h-divider {
      height: 1px;
      margin: ${theme.spacing["2x"]} 0;
      background: ${theme.palette.divider};
    }

    .${pfx}-node-item {
      display: flex;
      justify-content: space-between;
      margin-top: ${theme.spacing["2x"]};
      gap: ${theme.spacing["2x"]};
      .${pfx}-vertex-type {
        display: flex;
        align-items: center;
        column-gap: ${theme.spacing["2x"]};

        .${pfx}-icon {
          color: ${theme.palette.primary.main};
        }
      }
    }

    .${pfx}-filters-section {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing["2x"]};
      padding: ${theme.spacing["4x"]};
      flex-grow: 1;
      overflow-y: auto;
      min-height: 250px;

      .${pfx}-title {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
      }

      .${pfx}-content {
        display: flex;
        .${pfx}-chip {
          padding: ${theme.spacing["2x"]};
          background: ${fade(theme.palette.primary.main, 0.2)};
          color: ${theme.palette.primary.main};
        }
      }

      .${pfx}-filters {
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing["4x"]};
        margin-bottom: ${theme.spacing["4x"]};
        .${pfx}-single-filter {
          display: flex;
          align-items: center;
          gap: ${theme.spacing["2x"]};
          .${pfx}-input {
            flex-grow: 1;
            width: 100%;
          }
        }
      }

      .${pfx}-limit {
        display: flex;
        align-items: center;
        gap: ${theme.spacing["2x"]};
        .${pfx}-input {
          width: 100%;
        }
      }
    }

    .${pfx}-actions {
      display: flex;
      justify-content: flex-end;
      padding: ${theme.spacing["4x"]};
    }
  `;

export default defaultStyles;
