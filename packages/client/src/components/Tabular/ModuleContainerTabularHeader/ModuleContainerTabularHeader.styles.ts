import { css } from "@emotion/css";
import { ThemeStyleFn } from "../../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => {
  const { palette } = theme;
  return css`
    &.${pfx}-entities-tabular-header {
      position: relative;
      z-index: 100;
      display: flex;
      align-items: center;
      width: 100%;
      height: 42px;
      min-height: 42px;
      padding: 0 ${theme.spacing["3x"]};
      border-bottom: solid 1px ${palette.divider};
      background-color: ${palette.background.default};
      color: ${palette.text.primary};

      > .${pfx}-title {
        display: flex;
        align-items: center;
        font-weight: bold;
        margin-right: ${theme.spacing["4x"]};

        > .${pfx}-icon {
          font-size: 1.715em;
          margin-right: ${theme.spacing["2x"]};
        }
      }

      > .${pfx}-select-table {
        display: flex;
        align-items: center;
        min-width: 200px;

        > * {
          margin-bottom: 0;
        }
      }

      .${pfx}-space {
        flex-grow: 1;
      }

      > .${pfx}-divider {
        width: 2px;
        height: 60%;
        margin: auto ${theme.spacing.base};
        background-color: ${palette.divider};
      }
    }
  `;
};
export default defaultStyles;
