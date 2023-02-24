import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const baseStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    background-color: ${theme.palette.background.secondary};
    flex-grow: 1;

    &.${pfx}-layout-vertical {
      > .${pfx}-container {
        > .${pfx}-main {
          > .${pfx}-content-footer-section {
            > .${pfx}-content-section {
              flex-direction: column;
              padding: ${theme.spacing["2x"]};
              row-gap: ${theme.spacing["2x"]};
            }
          }
        }
      }
    }

    &.${pfx}-layout-horizontal {
      > .${pfx}-container {
        > .${pfx}-main {
          > .${pfx}-content-footer-section {
            > .${pfx}-content-section {
              flex-direction: row;
              padding: ${theme.spacing["2x"]};
              column-gap: ${theme.spacing["2x"]};
            }
          }
        }
      }
    }

    .${pfx}-space {
      flex-grow: 1;
    }

    > .${pfx}-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      height: 100%;
      overflow: hidden;

      .${pfx}-main {
        display: flex;
        flex-direction: row;
        flex-grow: 1;
        height: 100%;
        overflow: auto;

        .${pfx}-content-footer-section {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          height: 100%;
          overflow: auto;

          .${pfx}-content-section {
            flex-grow: 1;
            height: 100%;
            overflow: auto;
          }
        }

        .${pfx}-sidebar-section {
          display: flex;
          box-shadow: ${theme.shadow.left};
          background: ${theme.palette.background.default};
          > div:first-of-type {
            box-shadow: ${theme.shadow.base};
          }

          &.${pfx}-direction-row {
            flex-direction: row;
          }
          &.${pfx}-direction-row-reverse {
            flex-direction: row-reverse;
          }

          .${pfx}-sidebar-content {
            height: 100%;
            overflow-x: hidden;
            transition: width 200ms ease-in-out;
          }
        }
      }
    }
  `;

const titleSectionStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    display: flex;
    flex-direction: column;

    > .${pfx}-title {
      font-size: ${theme.typography.sizes.lg};
    }

    > .${pfx}-subtitle {
      font-size: ${theme.typography.sizes.xs};
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

const titleContainerStyles = (withBackButton?: boolean): ThemeStyleFn => ({
  theme,
}) =>
  css`
    display: flex;
    height: 100%;
    align-items: center;
    gap: ${theme.spacing["2x"]};
    margin-left: ${withBackButton ? "-" + theme.spacing["2x"] : 0};
  `;

const topBarTitleContent: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  width: 60%;
  height: 100%;
  padding: ${theme.spacing["2x"]} 0;
  justify-content: center;
`;

const topBarTitleVersion: ThemeStyleFn = ({ theme }) => css`
  display: flex;
  margin: ${theme.spacing["2x"]};
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
