import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const baseStyles: ThemeStyleFn = ({ theme }) => css`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  background-color: ${theme.palette.background.secondary};
  flex-grow: 1;

  &.layout-vertical {
    > .container {
      > .main {
        > .content-footer-section {
          > .content-section {
            flex-direction: column;
            padding: ${theme.spacing["2x"]};
            row-gap: ${theme.spacing["2x"]};
          }
        }
      }
    }
  }

  &.layout-horizontal {
    > .container {
      > .main {
        > .content-footer-section {
          > .content-section {
            flex-direction: row;
            padding: ${theme.spacing["2x"]};
            column-gap: ${theme.spacing["2x"]};
          }
        }
      }
    }
  }

  .space {
    flex-grow: 1;
  }

  > .container {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100%;
    overflow: hidden;

    .main {
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      height: 100%;
      overflow: auto;

      .content-footer-section {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;
        overflow: auto;

        .content-section {
          flex-grow: 1;
          height: 100%;
          overflow: auto;
        }
      }

      .sidebar-section {
        display: flex;
        box-shadow: ${theme.shadow.left};
        background: ${theme.palette.background.default};
        > div:first-of-type {
          box-shadow: ${theme.shadow.base};
        }

        &.direction-row {
          flex-direction: row;
        }
        &.direction-row-reverse {
          flex-direction: row-reverse;
        }

        .sidebar-content {
          height: 100%;
          overflow-x: hidden;
          transition: width 200ms ease-in-out;
        }
      }
    }
  }
`;

const titleSectionStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  flex-direction: column;

  > .title {
    font-weight: bold;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  > .subtitle {
    overflow: hidden;
    font-size: ${theme.typography.sizes.xs};
    line-height: 1.25em;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: ${theme.palette.text.secondary};
  }
`;

const togglesSectionStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  border-right: solid 1px ${theme.palette.border};
  > * {
    margin-right: ${theme.spacing.base};
  }
`;

const additionalControlsSectionStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  align-items: center;
  column-gap: ${theme.spacing.base};
  height: 100%;
`;

const contentSectionStyles: ThemeStyleFn = () => css`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
`;

const footerSectionStyles: ThemeStyleFn = () => css`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const topBarSectionStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  flex-direction: column;
  background-color: ${theme.palette.background.default};
  color: ${theme.palette.text.primary};
  border-bottom: solid 1px ${theme.palette.divider};
`;

const mainBarStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  align-items: center;
  min-height: 52px;
  height: 52px;
  padding: 0 ${theme.spacing["2x"]} 0 0;
  background-color: ${theme.palette.background.default};
  color: ${theme.palette.text.primary};
  gap: ${theme.spacing["3x"]};
`;

const subBarStyles: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 ${theme.spacing["2x"]} 0 ${theme.spacing["4x"]};
  background-color: ${theme.palette.background.default};
  color: ${theme.palette.text.primary};
  border-top: solid 1px ${theme.palette.divider};
`;

const titleContainerStyles =
  (withBackButton?: boolean): ThemeStyleFn =>
  ({ theme }) => css`
    display: flex;
    height: 100%;
    align-items: center;
    margin-left: ${withBackButton ? "-" + theme.spacing["2x"] : 0};
  `;

const topBarTitleContent: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  height: 100%;
  padding: ${theme.spacing["2x"]} 0;
  justify-content: center;
  flex-grow: 1;
  min-width: 240px;
`;

const topBarTitleVersion: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: ${theme.typography.sizes.xs};
  font-weight: ${theme.typography.weight.light};
  color: ${theme.palette.text.secondary};
`;

const styles = {
  additionalControlsSectionStyles,
  baseStyles,
  contentSectionStyles,
  footerSectionStyles,
  mainBarStyles,
  subBarStyles,
  titleContainerStyles,
  titleSectionStyles,
  togglesSectionStyles,
  topBarSectionStyles,
  topBarTitleContent,
  topBarTitleVersion,
};

export default styles;
