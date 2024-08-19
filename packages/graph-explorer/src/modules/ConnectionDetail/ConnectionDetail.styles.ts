import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  .info-bar {
    background: ${theme.palette.background.default};
    border-bottom: solid 1px ${theme.palette.divider};
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: ${theme.spacing["6x"]};
    padding: ${theme.spacing["4x"]};

    .item {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.base};
      padding: 0 ${theme.spacing["2x"]};

      .tag {
        display: flex;
        align-items: center;
        min-height: 24px;
        font-size: ${theme.typography.sizes?.xs};
        color: ${theme.palette.text.secondary};
        gap: ${theme.spacing.base};
      }

      .value {
        display: flex;
        align-items: center;
        gap: ${theme.spacing.base};
        font-weight: ${theme.typography.weight?.bold};
        color: ${theme.palette.text.primary};
        word-break: break-all;

        .value-chip {
          > span {
            display: flex;
            align-items: center;
            gap: ${theme.spacing.base};
          }
        }
        .prefix-counter {
          display: flex;
          gap: ${theme.spacing.base};
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

  .prefixes-list {
    min-height: 400px;
  }
`;

export default defaultStyles;
