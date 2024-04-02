import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles =
  (pfx: string): ThemeStyleFn =>
  ({ theme, isDarkTheme }) => css`
    position: relative;
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-content: center;
    justify-content: center;
    max-width: 700px;

    .${pfx}-bar-container {
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      column-gap: ${theme.spacing["2x"]};

      .${pfx}-search-input {
        flex-grow: 5;
        width: unset;

        .${pfx}-results-adornment {
          font-size: ${theme.typography.sizes?.xs};
          height: 100%;
          display: flex;
          align-items: center;
          color: ${theme.palette.text.secondary};
          padding-left: ${theme.spacing["2x"]};
        }
      }

      .${pfx}-entity-select {
        flex-grow: 1;
        min-width: 100px;
        width: 100px;
      }
    }

    .${pfx}-panel-container {
      display: flex;
      height: min(600px, 90vh);
      overflow: hidden;
      max-width: 700px;
      padding-top: ${theme.spacing.base};
      position: absolute;
      width: 100vw;
      z-index: ${theme.zIndex.popover};

      .${pfx}-search-controls {
        display: flex;
        flex-direction: row;
        height: 42px;
        column-gap: ${theme.spacing["2x"]};

        .${pfx}-search-input {
          flex-grow: 5;
          width: unset;
        }

        .${pfx}-entity-select {
          flex-grow: 1;
          min-width: 100px;
          width: 100px;
        }
      }

      .${pfx}-node-preview {
        width: 50%;
      }

      .${pfx}-search-results {
        align-items: center;
        display: flex;
        flex-grow: 1;
        height: 0;
        padding: ${theme.spacing["2x"]} 0;

        .${pfx}-search-results-grid {
          display: flex;
          height: 100%;
          width: 100%;
          gap: ${theme.spacing.base};

          .${pfx}-search-results-advanced-list {
            width: 300px;
            background: ${theme.palette.background.default};
            .${pfx}-advanced-list-item {
              background: ${theme.palette.background.secondary};
              .${pfx}-content {
                background: ${theme.palette.background.secondary};
              }
            }
          }

          .${pfx}-carousel {
            flex-grow: 1;
            overflow: hidden;
          }

          .${pfx}-graph-remove-icon {
            color: ${theme.palette.secondary.main};
          }
        }
      }

      .${pfx}-actions-footer {
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

        .${pfx}-footer-text {
          color: ${theme.palette.text.secondary};
          font-size: ${theme.typography.sizes["xs"]};
          flex-grow: 1;
          text-wrap: balance;
        }

        .${pfx}-refuse-shrink {
          flex-shrink: 0;
        }
      }
    }
  `;

export default defaultStyles;
