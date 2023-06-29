import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx?: string): ThemeStyleFn => ({ theme }) => css`
  display: contents;
  height: 100%;
  background: ${theme.palette.background.default};

  .${pfx}-header-children {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-right: ${theme.spacing["2x"]};
  }

  .${pfx}-info-bar {
    background: ${theme.palette.background.default};
    border-bottom: solid 1px ${theme.palette.divider};
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: ${theme.spacing["6x"]};
    padding: ${theme.spacing["4x"]};

    .${pfx}-item {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.base};
      padding: 0 ${theme.spacing["2x"]};
      max-width: 200px;

      .${pfx}-tag {
        display: flex;
        align-items: center;
        min-height: 24px;
        font-size: ${theme.typography.sizes?.xs};
        color: ${theme.palette.text.secondary};
        gap: ${theme.spacing.base};
      }

      .${pfx}-value {
        display: flex;
        align-items: center;
        gap: ${theme.spacing.base};
        font-weight: ${theme.typography.weight?.bold};
        color: ${theme.palette.text.primary};
        word-break: break-all;

        .${pfx}-value-chip {
          > span {
            display: flex;
            align-items: center;
            gap: ${theme.spacing.base};
          }
        }
        .${pfx}-prefix-counter {
          display: flex;
          gap: ${theme.spacing.base};
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

  .${pfx}-prefixes-list {
    min-height: 400px;
  }
`;

export default defaultStyles;
