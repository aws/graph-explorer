import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../../core";

const bannerCard = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    justify-content: center;
    margin: 0;
    line-height: ${theme.spacing["4x"]};
    flex-grow: 0;
    min-width: 80px;
    min-height: 50px;
    &.${pfx}-clickable {
      cursor: pointer;
      &:hover {
        border: 1px solid ${theme.palette.primary.main};
      }
    }
    &.${pfx}-outlined {
      border-radius: ${theme.shape.borderRadius};
      box-shadow: ${isDarkTheme ? "none" : theme.shadow.base};
      border: solid 1px ${theme.palette.border};
      background: ${theme.palette.background.default};
      color: ${theme.palette.text.primary};
    }
  `;

const widgetContent = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    .${pfx}-label {
      font-size: ${theme.typography.sizes.xs};
      color: ${theme.palette.text.disabled};
    }
    .${pfx}-value {
      display: inline-flex;
      align-items: center;
      font-size: 20px;
      font-weight: ${theme.typography.weight.bold};
    }
  `;

const contentNumber = (
  pfx: string,
  variant: "info" | "success" | "error" | "warning",
  color?: string
): ThemeStyleFn => ({ theme }) =>
  css`
    display: flex;
    align-items: center;
    .${pfx}-widget-content {
      padding: 0 ${theme.spacing.base};
      .${pfx}-title {
        font-size: ${theme.typography.sizes.xs};
        font-weight: ${theme.typography.weight.bold};
        color: ${theme.palette.text.primary};
        min-width: 60px;
        white-space: nowrap;
        padding-left: ${theme.spacing["2x"]};
      }
      .${pfx}-subtitle {
        font-size: ${theme.typography.sizes.xs};
        color: ${theme.palette.text.disabled};
        min-width: 80px;
      }
    }
    .${pfx}-value {
      flex-grow: 1;
      font-size: 32px;
      text-align: center;
      font-weight: ${theme.typography.weight.bold};
      white-space: nowrap;
      color: ${color
        ? color
        : theme.palette[variant]?.main || theme.palette.common.white};
    }
  `;

const listContent = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    font-size: ${theme.typography.sizes.xs};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
    .${pfx}-capitalized-bold {
      text-transform: capitalize;
      font-weight: ${theme.typography.weight.bold};
    }
    .${pfx}-primary-color {
      color: ${theme.palette.primary.main};
    }
  `;

const styles = {
  bannerCard,
  widgetContent,
  listContent,
  contentNumber,
};

export default styles;
