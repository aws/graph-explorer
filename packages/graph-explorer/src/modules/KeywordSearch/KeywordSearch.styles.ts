import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme, isDarkTheme }) => css`
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  max-width: 700px;

  .bar-container {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    column-gap: ${theme.spacing["2x"]};

    .search-input {
      flex-grow: 5;
      width: unset;
      margin-bottom: unset;

      .results-adornment {
        font-size: ${theme.typography.sizes?.xs};
        height: 100%;
        display: flex;
        align-items: center;
        color: ${theme.palette.text.secondary};
        padding-left: ${theme.spacing["2x"]};
      }
    }

    .entity-select {
      flex-grow: 1;
      min-width: 100px;
      width: 100px;
    }
  }

  .panel-container {
    display: flex;
    height: min(600px, 90vh);
    overflow: hidden;
    max-width: 700px;
    padding-top: ${theme.spacing.base};
    position: absolute;
    width: 100vw;
    z-index: ${theme.zIndex.popover};

    .node-preview {
      width: 50%;
    }

    .search-results {
      align-items: center;
      display: flex;
      flex-grow: 1;
      height: 0;
      padding: ${theme.spacing["2x"]} 0;

      .search-results-grid {
        display: flex;
        height: 100%;
        width: 100%;
        gap: ${theme.spacing.base};

        .search-results-advanced-list {
          width: 300px;
          background: ${theme.palette.background.default};
          .advanced-list-item {
            background: ${theme.palette.background.secondary};
            .content {
              background: ${theme.palette.background.secondary};
            }
          }
        }

        .carousel {
          flex-grow: 1;
          overflow: hidden;
        }

        .graph-remove-icon {
          color: ${theme.palette.secondary.main};
        }
      }
    }

    .actions-footer {
      margin-top: 0;
      width: 100%;
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing["2x"]};
      padding: ${theme.spacing["2x"]};
      justify-content: space-between;
      align-items: center;
      background-color: ${isDarkTheme
        ? theme.palette.background.secondary
        : theme.palette.background.default};
      border-top: solid 1px ${theme.palette.border};

      .footer-text {
        color: ${theme.palette.text.secondary};
        font-size: ${theme.typography.sizes["xs"]};
        flex-grow: 1;
        text-wrap: balance;
      }

      .refuse-shrink {
        flex-shrink: 0;
      }
    }
  }
`;

export default defaultStyles;
