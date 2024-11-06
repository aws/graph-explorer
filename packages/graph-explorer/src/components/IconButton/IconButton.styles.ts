import { css } from "@emotion/css";
import { cn } from "@/utils";
import type { ThemeStyleFn } from "@/core";
import { fade } from "@/core";
import {
  baseStyles,
  defaultStyles,
  getHeightBySize,
} from "../Button/Button.styles";

type stylesProps = {
  variant: "filled" | "default" | "text";
  size: "small" | "base" | "large";
  rounded?: boolean;
  isDisabled?: boolean;
};

export const defaultIconButtonStyles =
  ({ variant, size, rounded }: stylesProps): ThemeStyleFn =>
  activeTheme => {
    const { isDarkTheme, theme } = activeTheme;
    const {
      palette: { primary, text, background },
    } = theme;

    const variants: {
      filled: string;
      default: string;
      text: string;
    } = {
      filled: css`
        &.color-primary {
          color: ${theme.palette.primary.main};
          background: ${fade(theme.palette.primary.main, 0.2)};
        }
        &.color-info {
          color: ${theme.palette.info.main};
          background: ${fade(theme.palette.info.main, 0.2)};
        }
        &.color-success {
          color: ${theme.palette.success.main};
          background: ${fade(theme.palette.success.main, 0.2)};
        }
        &.color-warning {
          color: ${theme.palette.warning.main};
          background: ${fade(theme.palette.warning.main, 0.2)};
        }
        &.color-error {
          color: ${theme.palette.error.main};
          background: ${fade(theme.palette.error.main, 0.2)};
        }
        background-color: ${isDarkTheme ? primary.dark : primary.main};
        color: ${primary.contrastText};
        border: 1px solid transparent;
        border-radius: ${rounded ? "50%" : "5px"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${fade(background.contrast, 1)};
          color: ${text.disabled};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: ${isDarkTheme ? primary.main : primary.light};
          color: ${primary.contrastText};
          border: 1px solid transparent;
        }

        &:active {
          background-color: ${isDarkTheme ? primary.dark : primary.main};
          color: ${primary.contrastText};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${primary.main}`};
          outline: ${isDarkTheme ? `1px solid ${primary.light}` : "none"};
        }
      `,
      default: css`
        &.color-primary {
          color: ${theme.palette.primary.main};
          background: ${fade(theme.palette.primary.main, 0.2)};
        }
        &.color-info {
          color: ${theme.palette.info.main};
          background: ${fade(theme.palette.info.main, 0.2)};
        }
        &.color-success {
          color: ${theme.palette.success.main};
          background: ${fade(theme.palette.success.main, 0.2)};
        }
        &.color-warning {
          color: ${theme.palette.warning.main};
          background: ${fade(theme.palette.warning.main, 0.2)};
        }
        &.color-error {
          color: ${theme.palette.error.main};
          background: ${fade(theme.palette.error.main, 0.2)};
        }
        position: relative;
        background-color: ${isDarkTheme
          ? background.secondary
          : background.contrast};
        color: ${isDarkTheme ? primary.main : primary.dark};
        border: 1px solid transparent;
        border-radius: ${rounded ? "50%" : "5px"};
        box-shadow: ${isDarkTheme ? "none" : "0 2px 6px 0 rgba(0, 0, 0, 0.3)"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${fade(background.contrast, 0.7)};
          color: ${isDarkTheme ? primary.main : primary.dark};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: ${isDarkTheme
            ? background.contrast
            : background.default};
          color: ${isDarkTheme ? primary.light : primary.main};
          border: 1px solid transparent;
        }

        &:active {
          background-color: ${isDarkTheme
            ? background.contrastSecondary
            : background.secondary};
          color: ${primary.dark};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${primary.main}`};
          outline: ${isDarkTheme ? `1px solid ${primary.light}` : "none"};
        }
      `,
      text: css`
        &.color-primary {
          color: ${theme.palette.primary.main};
        }
        &.color-info {
          color: ${theme.palette.info.main};
        }
        &.color-success {
          color: ${theme.palette.success.main};
        }
        &.color-warning {
          color: ${theme.palette.warning.main};
        }
        &.color-error {
          color: ${theme.palette.error.main};
        }
        position: relative;
        background-color: transparent;
        color: ${isDarkTheme ? primary.main : primary.dark};
        border: 1px solid transparent;
        border-radius: ${rounded ? "50%" : "5px"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: transparent;
          color: ${text.disabled};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: transparent;
          color: ${isDarkTheme ? primary.light : primary.main};
          border: 1px solid transparent;
        }

        &:active {
          background-color: ${isDarkTheme
            ? background.contrastSecondary
            : background.secondary};
          color: ${primary.dark};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${primary.main}`};
          outline: ${isDarkTheme ? `1px solid ${primary.light}` : "none"};
        }
      `,
    };

    const iconButtonStyles = css`
      min-width: ${getHeightBySize(size)};
      padding: 0;
    `;

    return cn(variants[variant], baseStyles(theme, size), iconButtonStyles);
  };

type toggleButtonStylesProps = {
  variant: "filled" | "default" | "text";
  size: "small" | "base" | "large";
  rounded: boolean;
  isDisabled?: boolean;
  isSelected: boolean;
  styleLike: "button" | "iconButton";
};

export const defaultToggleButtonStyles =
  ({
    variant,
    size,
    styleLike,
    isSelected,
    isDisabled,
    rounded,
  }: toggleButtonStylesProps): ThemeStyleFn =>
  activeTheme => {
    const { isDarkTheme, theme } = activeTheme;
    const {
      palette: { primary, background, text },
    } = theme;

    const selectedStylesByVariantMap = {
      filled: css`
        background-color: ${primary.dark};
        color: ${primary.contrastText};
        &:disabled,
        &[disabled] {
          background-color: ${primary.dark} !important;
          color: ${primary.contrastText} !important;
          filter: opacity(70%) !important;
        }
      `,
      default: css`
        background-color: ${isDarkTheme
          ? fade(primary.dark, 0.25)
          : "transparent"};
        color: ${primary.main};
        &:disabled,
        &[disabled] {
          background-color: ${isDarkTheme
            ? fade(primary.dark, 0.25)
            : "transparent"} !important;
          color: ${primary.main} !important;
          filter: opacity(70%) !important;
        }
      `,
      text: css`
        background-color: ${fade(theme.palette.primary.main, 0.2)};
        color: ${isDarkTheme ? primary.light : primary.main};
        &:hover {
          background-color: ${fade(theme.palette.primary.main, 0.5)};
          color: ${primary.dark};
          &:focus-visible {
            box-shadow: none !important;
            border: 1px solid
              ${isDarkTheme ? background.contrast : "transparent"};
          }
        }
        &:disabled,
        &[disabled] {
          background-color: ${isDarkTheme
            ? background.contrast
            : "transparent"} !important;
          color: ${isDarkTheme ? primary.light : primary.main} !important;
          filter: opacity(70%) !important;
        }
      `,
    };

    const stylesByVariantMap = {
      filled: "",
      default: css`
        color: ${isDarkTheme ? text.disabled : primary.dark};
      `,
      text: "",
    };

    const styles =
      styleLike === "button" ? defaultStyles : defaultIconButtonStyles;
    return cn(
      styles({ variant, size, isDisabled, rounded })(activeTheme),
      stylesByVariantMap[variant],
      isSelected ? selectedStylesByVariantMap[variant] : ""
    );
  };
