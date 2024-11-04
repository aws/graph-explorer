import { css } from "@emotion/css";
import { cn } from "@/utils";
import type { ProcessedTheme, ThemeStyleFn } from "@/core";
import { fade } from "@/core";

export const getHeightBySize = (size: "small" | "base" | "large") => {
  const sizeMap = {
    small: "24px",
    base: "30px",
    large: "42px",
  };

  return sizeMap[size];
};

export const getPaddingSizeBySize = (
  theme: ProcessedTheme,
  size: "small" | "base" | "large"
) => {
  const sizeMap = {
    small: theme.spacing.base,
    base: theme.spacing["2x"],
    large: theme.spacing["4x"],
  };

  return sizeMap[size];
};

export const getFontSizeBySize = (size: "small" | "base" | "large") => {
  const sizeMap = {
    small: "0.85em",
    base: "1em",
    large: "1.15em",
  };

  return sizeMap[size];
};

export const getIconFontSizeBySize = (size: "small" | "base" | "large") => {
  const sizeMap = {
    small: "1.513em",
    base: "1.715em",
    large: "1.988em",
  };

  return sizeMap[size];
};

export const baseStyles = (
  theme: ProcessedTheme,
  size: "small" | "base" | "large"
) => css`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${getHeightBySize(size)};
  font-size: ${getFontSizeBySize(size)};
  font-weight: ${theme.typography.weight.base};
  font-family: ${theme.typography.fontFamily || "sans-serif"};
  cursor: pointer;

  svg {
    font-size: ${getIconFontSizeBySize(size)};
  }
`;

type StylesProps = {
  variant: "filled" | "default" | "text" | "danger";
  size: "small" | "base" | "large";
  rounded?: boolean;
  isDisabled?: boolean;
};

export const defaultStyles =
  ({ variant, size }: StylesProps): ThemeStyleFn =>
  activeTheme => {
    const { isDarkTheme, theme } = activeTheme;
    const {
      palette: { primary, text, background, error },
    } = theme;

    const variants: {
      filled: string;
      default: string;
      text: string;
      danger: string;
    } = {
      filled: css`
        position: relative;
        padding: 0 ${getPaddingSizeBySize(theme, size)};
        background-color: ${isDarkTheme ? primary?.dark : primary?.main};
        color: ${primary?.contrastText};
        border: 1px solid transparent;
        border-radius: 5px;

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${fade(background?.contrast, 1)};
          color: ${text?.disabled};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: ${isDarkTheme ? primary?.main : primary?.light};
          color: ${primary?.contrastText};
          border: 1px solid transparent;
        }

        &:active {
          background-color: ${isDarkTheme ? primary?.dark : primary?.main};
          color: ${primary?.contrastText};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${primary?.main}`};
          outline: ${isDarkTheme ? `1px solid ${primary?.light}` : "none"};
        }
      `,
      default: css`
        padding: 0 ${getPaddingSizeBySize(theme, size)};
        background-color: ${isDarkTheme
          ? background?.secondary
          : background?.contrast};
        color: ${isDarkTheme ? primary?.main : primary?.dark};
        border: 1px solid transparent;
        border-radius: 5px;

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${fade(background?.contrast, 0.8)};
          color: ${text?.disabled};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: ${background?.contrast};
          color: ${isDarkTheme ? primary?.light : primary?.main};
          border: 1px solid transparent;
        }

        &:active {
          background-color: ${background?.contrast};
          color: ${primary?.dark};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${primary?.main}`};
          outline: ${isDarkTheme ? `1px solid ${primary?.light}` : "none"};
        }
      `,
      text: css`
        background-color: transparent;
        color: ${isDarkTheme ? primary?.main : primary?.dark};
        border: 1px solid transparent;

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: transparent;
          color: ${text?.disabled};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: transparent;
          color: ${isDarkTheme ? primary?.light : primary?.main};
          border: 1px solid transparent;
          border-radius: 5px;
        }

        &:active {
          background-color: transparent;
          color: ${primary?.dark};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${primary?.main}`};
          outline: ${isDarkTheme ? `1px solid ${primary?.light}` : "none"};
        }
      `,
      danger: css`
        position: relative;
        padding: 0 ${getPaddingSizeBySize(theme, size)};
        background-color: ${isDarkTheme ? error?.dark : error?.main};
        color: ${error?.contrastText};
        border: 1px solid transparent;
        border-radius: 5px;

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${fade(background?.contrast, 1)};
          color: ${text?.disabled};
          border: 1px solid transparent;
        }

        &:hover {
          background-color: ${isDarkTheme ? error?.main : error?.light};
          color: ${error?.contrastText};
          border: 1px solid transparent;
        }

        &:active {
          background-color: ${isDarkTheme ? error?.dark : error?.main};
          color: ${error?.contrastText};
          border: 1px solid transparent;
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme ? "none" : `0 0 3px ${error?.main}`};
          outline: ${isDarkTheme ? `1px solid ${error?.light}` : "none"};
        }
      `,
    };

    return cn(variants[variant], baseStyles(theme, size));
  };
