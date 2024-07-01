import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";
import { fade } from "../../../core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  &.module-container-header {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 42px;
    padding: 0 ${theme.spacing["2x"]} 0 ${theme.spacing["3x"]};
    border-bottom: solid 1px ${theme.palette.border};
    background-color: ${theme.palette.background.default};
    color: ${theme.palette.text.primary};

    .back-action {
      margin-right: ${theme.spacing.base};
    }

    .title-container {
      > .title {
        font-weight: bold;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      > .subtitle {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: ${theme.typography.sizes.xs};
      }
    }

    .divider {
      width: 1px;
      height: 60%;
      margin: auto ${theme.spacing["2x"]};
      background-color: ${theme.palette.divider};
    }

    > .start-adornment {
      display: flex;
      align-items: center;
      margin-right: ${theme.spacing["2x"]};
    }

    > .children-container {
      flex-grow: 1;
    }
    > .actions-container {
      height: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    > .actions-container button:hover {
      color: ${theme.palette.primary.main};
    }

    > .actions-container button:focus {
      color: ${theme.palette.primary.main};
      background-color: ${fade(theme.palette.primary.main, 0.2)};
    }
  }
`;

export default defaultStyles;

export const buttonMenuListItem: ThemeStyleFn = ({ theme }) => css`
  font-size: ${theme.typography.sizes?.xs};
  padding-right: ${theme.spacing["2x"]};

  .content {
    min-height: 28px;
    height: 28px;
  }
`;
