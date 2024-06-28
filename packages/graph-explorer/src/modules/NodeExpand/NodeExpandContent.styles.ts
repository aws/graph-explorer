import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import fade from "../../core/ThemeProvider/utils/fade";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  background: ${theme.palette.background.default};

  .empty-panel-state {
    height: auto;
    flex-grow: 1;
  }
  .h-divider {
    height: 1px;
    margin: ${theme.spacing["2x"]} 0;
    background: ${theme.palette.divider};
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
    padding: ${theme.spacing["4x"]};
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
      .single-filter {
        display: flex;
        align-items: center;
        gap: ${theme.spacing["2x"]};
        .input {
          flex-grow: 1;
          width: 100%;
        }
      }
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
