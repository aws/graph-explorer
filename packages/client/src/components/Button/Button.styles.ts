import { css, cx } from "@emotion/css";
import type { ProcessedTheme, ThemeStyleFn } from "../../core";
import { fade } from "../../core";
import type { ButtonTheme } from "./Button.model";

export const getHeightBySize = (
  theme: ProcessedTheme<ButtonTheme>,
  size: "small" | "base" | "large"
) => {
  const sizeMap = {
    small: theme.button?.sizes?.small || "24px",
    base: theme.button?.sizes?.base || "30px",
    large: theme.button?.sizes?.large || "38px",
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
  font-family: ${theme.typography.fontFamily || "sans-serif"};
  cursor: pointer;

  svg {
    font-size: ${getIconFontSizeBySize(size)};
  }
`;

type StylesProps = {
  variant: "filled" | "default" | "text";
  size: "small" | "base" | "large";
  rounded?: boolean;
  isDisabled?: boolean;
};

export const defaultStyles = ({
  variant,
  size,
}: StylesProps): ThemeStyleFn<ButtonTheme> => activeTheme => {
  const { isDarkTheme, theme } = activeTheme;
  const {
    palette: { primary, text, background },
  } = theme;
  const themeByVariant =
    variant !== "default" ? theme?.button?.variants?.[variant] : theme.button;

  const variants: {
    filled: string;
    default: string;
    text: string;
  } = {
    filled: css`
      position: relative;
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

      &:focus {
        box-shadow: ${isDarkTheme
          ? "none"
          : `0 0 3px ${themeByVariant?.hover?.background || primary?.main}`};
        outline: ${isDarkTheme
          ? `1px solid ${themeByVariant?.hover?.background || primary?.light}`
          : "none"};
      }
    `,
    default: css`
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

      &:focus {
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
        background-color: ${themeByVariant?.hover?.background || "transparent"};
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

      &:focus {
        box-shadow: ${isDarkTheme
          ? "none"
          : `0 0 3px ${themeByVariant?.hover?.background || primary?.main}`};
        outline: ${isDarkTheme
          ? `1px solid ${themeByVariant?.hover?.background || primary?.light}`
          : "none"};
      }
    `,
  };

  return cx(variants[variant], baseStyles(theme, size));
};
