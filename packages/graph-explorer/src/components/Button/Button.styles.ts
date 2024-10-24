import { css } from "@emotion/css";
import { cn } from "@/utils";
import type { ProcessedTheme, ThemeStyleFn } from "@/core";
import { fade } from "@/core";
import type { ButtonTheme } from "./Button.model";

export const getHeightBySize = (
  theme: ProcessedTheme<ButtonTheme>,
  size: "small" | "base" | "large"
) => {
  const sizeMap = {
    small: theme.button?.sizes?.small || "24px",
    base: theme.button?.sizes?.base || "30px",
    large: theme.button?.sizes?.large || "42px",
  };

  return sizeMap[size];
};

export const getPaddingSizeBySize = (
  theme: ProcessedTheme<ButtonTheme>,
  size: "small" | "base" | "large"
) => {
  const sizeMap = {
    small: theme.spacing.base || "4px",
    base: theme.spacing["2x"] || "16px",
    large: theme.spacing["4x"] || "24px",
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
  theme: ProcessedTheme<ButtonTheme>,
  size: "small" | "base" | "large"
) => css`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${getHeightBySize(theme, size)};
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
  ({ variant, size }: StylesProps): ThemeStyleFn<ButtonTheme> =>
  activeTheme => {
    const { isDarkTheme, theme } = activeTheme;
    const {
      palette: { primary, text, background, error },
    } = theme;
    const themeByVariant =
      variant !== "default" ? theme?.button?.variants?.[variant] : theme.button;

    const variants: {
      filled: string;
      default: string;
      text: string;
      danger: string;
    } = {
      filled: css`
        position: relative;
        padding: 0 ${getPaddingSizeBySize(theme, size)};
        background-color: ${themeByVariant?.background ||
        (isDarkTheme ? primary?.dark : primary?.main)};
        color: ${themeByVariant?.color || primary?.contrastText};
        border: ${themeByVariant?.border?.width || "1px"} solid
          ${themeByVariant?.border?.color || "transparent"};
        border-radius: ${themeByVariant?.border?.radius || "5px"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${themeByVariant?.disabled?.background ||
          fade(background?.contrast, 1)};
          color: ${themeByVariant?.disabled?.color || text?.disabled};
          border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
            ${themeByVariant?.disabled?.border?.color || "transparent"};
        }

        &:hover {
          background-color: ${themeByVariant?.hover?.background ||
          (isDarkTheme ? primary?.main : primary?.light)};
          color: ${themeByVariant?.hover?.color || primary?.contrastText};
          border: ${themeByVariant?.hover?.border?.width || "1px"} solid
            ${themeByVariant?.hover?.border?.color || "transparent"};
        }

        &:active {
          background-color: ${themeByVariant?.active?.background ||
          (isDarkTheme ? primary?.dark : primary?.main)};
          color: ${themeByVariant?.active?.color || primary?.contrastText};
          border: ${themeByVariant?.active?.border?.width || "1px"} solid
            ${themeByVariant?.active?.border?.color || "transparent"};
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme
            ? "none"
            : `0 0 3px ${themeByVariant?.hover?.background || primary?.main}`};
          outline: ${isDarkTheme
            ? `1px solid ${themeByVariant?.hover?.background || primary?.light}`
            : "none"};
        }
      `,
      default: css`
        padding: 0 ${getPaddingSizeBySize(theme, size)};
        background-color: ${themeByVariant?.background ||
        (isDarkTheme ? background?.secondary : background?.contrast)};
        color: ${themeByVariant?.color ||
        (isDarkTheme ? primary?.main : primary?.dark)};
        border: ${themeByVariant?.border?.width || "1px"} solid
          ${themeByVariant?.border?.color || "transparent"};
        border-radius: ${themeByVariant?.border?.radius || "5px"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${fade(
            themeByVariant?.disabled?.background || background?.contrast,
            0.8
          )};
          color: ${themeByVariant?.disabled?.color || text?.disabled};
          border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
            ${themeByVariant?.disabled?.border?.color || "transparent"};
        }

        &:hover {
          background-color: ${themeByVariant?.hover?.background ||
          background?.contrast};
          color: ${themeByVariant?.hover?.color ||
          (isDarkTheme ? primary?.light : primary?.main)};
          border: ${themeByVariant?.hover?.border?.width || "1px"} solid
            ${themeByVariant?.hover?.border?.color || "transparent"};
        }

        &:active {
          background-color: ${themeByVariant?.active?.background ||
          background?.contrast};
          color: ${themeByVariant?.active?.color || primary?.dark};
          border: ${themeByVariant?.active?.border?.width || "1px"} solid
            ${themeByVariant?.active?.border?.color || "transparent"};
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme
            ? "none"
            : `0 0 3px ${themeByVariant?.hover?.background || primary?.main}`};
          outline: ${isDarkTheme
            ? `1px solid ${themeByVariant?.hover?.background || primary?.light}`
            : "none"};
        }
      `,
      text: css`
        background-color: ${themeByVariant?.background || "transparent"};
        color: ${themeByVariant?.color ||
        (isDarkTheme ? primary?.main : primary?.dark)};
        border: ${themeByVariant?.border?.width || "1px"} solid
          ${themeByVariant?.border?.color || "transparent"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${themeByVariant?.disabled?.background ||
          "transparent"};
          color: ${themeByVariant?.disabled?.color || text?.disabled};
          border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
            ${themeByVariant?.disabled?.border?.color || "transparent"};
        }

        &:hover {
          background-color: ${themeByVariant?.hover?.background ||
          "transparent"};
          color: ${themeByVariant?.hover?.color ||
          (isDarkTheme ? primary?.light : primary?.main)};
          border: ${themeByVariant?.hover?.border?.width || "1px"} solid
            ${themeByVariant?.hover?.border?.color || "transparent"};
          border-radius: ${themeByVariant?.border?.radius || "5px"};
        }

        &:active {
          background-color: ${themeByVariant?.active?.background ||
          "transparent"};
          color: ${themeByVariant?.active?.color || primary?.dark};
          border: ${themeByVariant?.active?.border?.width || "1px"} solid
            ${themeByVariant?.active?.border?.color || "transparent"};
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme
            ? "none"
            : `0 0 3px ${themeByVariant?.hover?.background || primary?.main}`};
          outline: ${isDarkTheme
            ? `1px solid ${themeByVariant?.hover?.background || primary?.light}`
            : "none"};
        }
      `,
      danger: css`
        position: relative;
        padding: 0 ${getPaddingSizeBySize(theme, size)};
        background-color: ${themeByVariant?.background ||
        (isDarkTheme ? error?.dark : error?.main)};
        color: ${themeByVariant?.color || error?.contrastText};
        border: ${themeByVariant?.border?.width || "1px"} solid
          ${themeByVariant?.border?.color || "transparent"};
        border-radius: ${themeByVariant?.border?.radius || "5px"};

        &:disabled,
        &[disabled] {
          pointer-events: none;
          background-color: ${themeByVariant?.disabled?.background ||
          fade(background?.contrast, 1)};
          color: ${themeByVariant?.disabled?.color || text?.disabled};
          border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
            ${themeByVariant?.disabled?.border?.color || "transparent"};
        }

        &:hover {
          background-color: ${themeByVariant?.hover?.background ||
          (isDarkTheme ? error?.main : error?.light)};
          color: ${themeByVariant?.hover?.color || error?.contrastText};
          border: ${themeByVariant?.hover?.border?.width || "1px"} solid
            ${themeByVariant?.hover?.border?.color || "transparent"};
        }

        &:active {
          background-color: ${themeByVariant?.active?.background ||
          (isDarkTheme ? error?.dark : error?.main)};
          color: ${themeByVariant?.active?.color || error?.contrastText};
          border: ${themeByVariant?.active?.border?.width || "1px"} solid
            ${themeByVariant?.active?.border?.color || "transparent"};
        }

        &:focus-visible {
          box-shadow: ${isDarkTheme
            ? "none"
            : `0 0 3px ${themeByVariant?.hover?.background || error?.main}`};
          outline: ${isDarkTheme
            ? `1px solid ${themeByVariant?.hover?.background || error?.light}`
            : "none"};
        }
      `,
    };

    return cn(variants[variant], baseStyles(theme, size));
  };
