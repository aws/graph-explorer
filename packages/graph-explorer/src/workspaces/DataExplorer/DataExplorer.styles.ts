import { css } from "@emotion/css";
import { ActiveThemeType, fade } from "@/core";

const defaultStyles = ({ theme }: ActiveThemeType) => css`
  &.data-explorer {
    .top-bar {
      min-width: 500px;
    }

    .button {
      white-space: nowrap;
    }
    .v-divider {
      height: 24px;
      width: 2px;
      margin: 0 ${theme.spacing["2x"]};
      background: ${theme.palette.divider};
    }

    .vertex-count {
      margin-left: ${theme.spacing.base};
    }

    .banner {
      display: flex;
      gap: ${theme.spacing["4x"]};

      .kpi {
        max-width: 300px;
        display: flex;
        align-items: center;
        flex-direction: row;
        padding: ${theme.spacing["4x"]};
        gap: ${theme.spacing["4x"]};

        .icon {
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

        .kpi-content {
          display: flex;
          flex-direction: column;
          gap: ${theme.spacing["2x"]};

          .title {
            font-size: ${theme.typography.sizes?.lg};
            font-weight: ${theme.typography.weight?.bold};
          }
          .subtitle {
            color: ${theme.palette.text.secondary};
            font-size: ${theme.typography.sizes?.base};
          }
        }
      }
    }

    .advanced-list-item-title {
      display: flex;
      gap: ${theme.spacing["4x"]};

      .node-title {
        min-width: 200px;
        font-weight: ${theme.typography.weight?.bold};
      }
      .nodes-count {
        color: ${theme.palette.text.secondary};
        font-weight: ${theme.typography.weight?.base};
      }
    }

    .advanced-list {
      background: ${theme.palette.background.secondary};
      .content {
        background: ${theme.palette.background.secondary};
        .advanced-list-nogroup {
          height: 100%;
          .advanced-list-item {
            background: ${theme.palette.background.default};
            .content {
              background: ${theme.palette.background.default};
            }
          }
        }
      }
    }

    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 ${theme.spacing["2x"]};
      min-height: 36px;
      background: ${theme.palette.background.default};
      border-top: solid 1px ${theme.palette.border};
    }
    .container-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.spacing["2x"]};

      .spinner {
        width: 24px;
        height: 24px;
        > * {
          color: ${theme.palette.primary.main};
        }
      }
    }

    .header-children {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: ${theme.spacing["2x"]};
    }
  }
`;

export default defaultStyles;
