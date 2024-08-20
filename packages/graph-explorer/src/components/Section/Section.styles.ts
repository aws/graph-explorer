import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

type DefaultStylesProps = {
  disablePadding?: boolean;
  disableBorder?: boolean;
  collapseAction?: "all" | "indicator";
};

const defaultStyles: (props: DefaultStylesProps) => ThemeStyleFn =
  ({ disablePadding, disableBorder, collapseAction }) =>
  ({ theme, isDarkTheme }) => css`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: ${disablePadding ? 0 : theme.spacing.base};
    border-bottom: ${disableBorder
      ? "none"
      : `solid 1px ${theme.palette.border}`};

    :last-child {
      border-bottom: none;
    }

    .header-container {
      ${collapseAction === "all" ? "cursor: pointer;" : ""}
      display: flex;
      background: ${isDarkTheme
        ? theme.palette.background.secondary
        : theme.palette.background.default};
      justify-content: space-between;
      min-height: 36px;
      padding: ${theme.spacing["2x"]};
      box-sizing: border-box;
    }

    .title {
      flex-grow: 1;
    }

    .collapse-action {
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 24px;
      cursor: pointer;
    }

    .collapsible-container {
      flex-grow: 1;
      height: auto;
      padding: ${disablePadding ? 0 : `0 ${theme.spacing["2x"]}`};
    }

    .collapsed {
      height: 0;
      overflow: hidden;
    }
  `;

export default defaultStyles;
