import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";
import fade from "@/core/ThemeProvider/utils/fade";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  .empty-panel-state {
    height: auto;
    flex-grow: 1;
  }

  .node-item {
    display: flex;
    justify-content: space-between;
    margin-top: ${theme.spacing["2x"]};
    gap: ${theme.spacing["2x"]};
    .vertex-type {
      display: flex;
      align-items: center;
      column-gap: ${theme.spacing["2x"]};

      .icon {
        color: ${theme.palette.primary.main};
      }
    }
  }

  .filters-section {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing["2x"]};
    padding: ${theme.spacing["4x"]} ${theme.spacing["3x"]};
    flex-grow: 1;
    overflow-y: auto;
    min-height: 250px;

    .title {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }

    .content {
      display: flex;
      .chip {
        padding: ${theme.spacing["2x"]};
        background: ${fade(theme.palette.primary.main, 0.2)};
        color: ${theme.palette.primary.main};
      }
    }

    .filters {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing["4x"]};
      margin-bottom: ${theme.spacing["4x"]};
    }

    .limit {
      display: flex;
      align-items: center;
      gap: ${theme.spacing["2x"]};
      .input {
        width: 100%;
      }
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    padding: ${theme.spacing["4x"]};
  }
`;

export default defaultStyles;
