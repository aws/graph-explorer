import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";

const autocompleteBoxStyles = (pfx: string): ThemeStyleFn => () => {
  return css`
    &.${pfx}-autocomplete-box {
      .${pfx}-clear-button-hidden {
        visibility: hidden;
      }
    }
  `;
};

const autocompleteStyles = (pfx: string): ThemeStyleFn => ({ theme }) => {
  return css`
    &.${pfx}-autocomplete {
      .${pfx}-title {
        padding: ${theme.spacing["2x"]} 0;
        font-weight: bold;
        font-size: ${theme.typography.sizes.xs};
      }
      .${pfx}-input-wrapper {
      }
      .${pfx}-list-item-active {
        background-color: ${fade(theme.palette.primary.main, 0.1)};
        box-shadow: none;
        overflow: hidden;
        border-radius: ${theme.shape.borderRadius};
        border-right: solid 1px ${theme.palette.border};
        height: 32px;
        margin-bottom: ${theme.spacing["2x"]};

        .${pfx}-content {
          background: none;
          .${pfx}-primary {
            font-weight: ${theme.typography.weight.base};
          }
        }

        .${pfx}-start-adornment {
          color: ${theme.palette.primary.main};
        }
      }
    }
    &.${pfx}-autocomplete-item {
      height: 20px;
      .${pfx}-start-adornment {
        > svg {
          color: ${theme.palette.primary.main};
        }
      }
    }
  `;
};

const styles = {
  autocompleteBoxStyles,
  autocompleteStyles,
};

export default styles;
