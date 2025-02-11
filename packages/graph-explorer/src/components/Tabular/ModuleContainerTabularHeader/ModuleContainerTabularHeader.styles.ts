import { css } from "@emotion/css";
import { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => {
  const { palette } = theme;
  return css`
    &.entities-tabular-header {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 48px;
      min-height: 48px;
      padding: 0 ${theme.spacing["3x"]};
      background-color: ${palette.background.default};
      color: ${palette.text.primary};

      > .title {
        display: flex;
        align-items: center;
        font-weight: bold;
        margin-right: ${theme.spacing["4x"]};

        > .icon {
          font-size: 1.715em;
          margin-right: ${theme.spacing["2x"]};
        }
      }

      > .select-table {
        display: flex;
        align-items: center;
        min-width: 200px;

        > * {
          margin-bottom: 0;
        }
      }
    }
  `;
};
export default defaultStyles;
