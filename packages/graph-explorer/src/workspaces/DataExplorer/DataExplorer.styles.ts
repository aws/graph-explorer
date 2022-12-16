import { css } from "@emotion/css";
import { ActiveThemeType, fade, ProcessedTheme } from "../../core";

const defaultStyles = (pfx: string) => ({
  theme,
}: ActiveThemeType<ProcessedTheme>) =>
  css`
    &.${pfx}-data-explorer {
      .${pfx}-top-bar {
        min-width: 500px;
      }

      .${pfx}-top-bar-title {
        font-weight: bold;
      }
      .${pfx}-top-bar-subtitle {
        font-size: ${theme.typography.sizes?.xs};
      }
      .${pfx}-button {
        white-space: nowrap;
      }
      .${pfx}-v-divider {
        height: 24px;
        width: 2px;
        margin: 0 ${theme.spacing["2x"]};
        background: ${theme.palette.divider};
      }

      .${pfx}-vertex-count {
        margin-left: ${theme.spacing.base};
      }

      .${pfx}-banner {
        display: flex;
        gap: ${theme.spacing["4x"]};

        .${pfx}-kpi {
          max-width: 300px;
          display: flex;
          align-items: center;
          flex-direction: row;
          padding: ${theme.spacing["4x"]};
          gap: ${theme.spacing["4x"]};

          .${pfx}-icon {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 48px;
            height: 48px;
            border-radius: 24px;
            font-size: 1.7rem;
            color: ${theme.palette.primary.main};
            background: ${fade(theme.palette.primary.main, 0.3)};
          }

          .${pfx}-kpi-content {
            display: flex;
            flex-direction: column;
            gap: ${theme.spacing["2x"]};

            .${pfx}-title {
              font-size: ${theme.typography.sizes?.lg};
              font-weight: ${theme.typography.weight?.bold};
            }
            .${pfx}-subtitle {
              color: ${theme.palette.text.secondary};
              font-size: ${theme.typography.sizes?.base};
            }
          }
        }
      }

      .${pfx}-advanced-list-item-title {
        display: flex;
        gap: ${theme.spacing["4x"]};

        .${pfx}-node-title {
          min-width: 200px;
          font-weight: ${theme.typography.weight?.bold};
        }
        .${pfx}-nodes-count {
          color: ${theme.palette.text.secondary};
          font-weight: ${theme.typography.weight?.base};
        }
      }

      .${pfx}-advanced-list {
        background: ${theme.palette.background.secondary};
        .${pfx}-content {
          background: ${theme.palette.background.secondary};
          .${pfx}-advanced-list-nogroup {
            height: 100%;
            .${pfx}-advanced-list-item {
              background: ${theme.palette.background.default};
              .${pfx}-content {
                background: ${theme.palette.background.default};
              }
            }
          }
        }
      }

      .${pfx}-pagination-container {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 ${theme.spacing["2x"]};
        min-height: 36px;
        background: ${theme.palette.background.default};
        border-top: solid 1px ${theme.palette.border};
      }
      .${pfx}-container-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: ${theme.spacing["2x"]};

        .${pfx}-spinner {
          width: 24px;
          height: 24px;
          > * {
            color: ${theme.palette.primary.main};
          }
        }
      }

      .${pfx}-header-children {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: ${theme.spacing["2x"]};
        .${pfx}-header-select {
          width: 200px;
        }
      }
    }
  `;

export default defaultStyles;
