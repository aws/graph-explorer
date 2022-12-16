import { css, cx } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import { fade } from "../../core";
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

export const defaultIconButtonStyles = ({
  variant,
  size,
  rounded,
}: stylesProps): ThemeStyleFn => activeTheme => {
  const { isDarkTheme, theme } = activeTheme;
  const {
    palette: { primary, text, background },
  } = theme;

  const themeByVariant =
    variant !== "default"
      ? theme?.iconButton?.variants?.[variant]
      : theme.iconButton;

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
      background-color: ${themeByVariant?.background ||
      (isDarkTheme ? primary.dark : primary.main)};
      color: ${themeByVariant?.color || primary.contrastText};
      border: ${themeByVariant?.border?.width || "1px"} solid
        ${themeByVariant?.border?.color || "transparent"};
      border-radius: ${rounded
        ? "50%"
        : themeByVariant?.border?.radius || "5px"};

      &:disabled,
      &[disabled] {
        pointer-events: none;
        background-color: ${themeByVariant?.disabled?.background ||
        fade(background.contrast, 1)};
        color: ${themeByVariant?.disabled?.color || text.disabled};
        border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
          ${themeByVariant?.disabled?.border?.color || "transparent"};
      }

      &:hover {
        background-color: ${themeByVariant?.hover?.background ||
        (isDarkTheme ? primary.main : primary.light)};
        color: ${themeByVariant?.hover?.color || primary.contrastText};
        border: ${themeByVariant?.hover?.border?.width || "1px"} solid
          ${themeByVariant?.hover?.border?.color || "transparent"};
      }

      &:active {
        background-color: ${themeByVariant?.active?.background ||
        (isDarkTheme ? primary.dark : primary.main)};
        color: ${themeByVariant?.active?.color || primary.contrastText};
        border: ${themeByVariant?.active?.border?.width || "1px"} solid
          ${themeByVariant?.active?.border?.color || "transparent"};
      }

      &:focus {
        box-shadow: ${isDarkTheme
          ? "none"
          : `0 0 3px ${themeByVariant?.hover?.background || primary.main}`};
        outline: ${isDarkTheme
          ? `1px solid ${themeByVariant?.hover?.background || primary.light}`
          : "none"};
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
      background-color: ${themeByVariant?.background ||
      (isDarkTheme ? background.secondary : background.contrast)};
      color: ${themeByVariant?.color ||
      (isDarkTheme ? primary.main : primary.dark)};
      border: ${themeByVariant?.border?.width || "1px"} solid
        ${themeByVariant?.border?.color || "transparent"};
      border-radius: ${rounded
        ? "50%"
        : themeByVariant?.border?.radius || "5px"};
      box-shadow: ${isDarkTheme
        ? "none"
        : themeByVariant?.shadow || "0 2px 6px 0 rgba(0, 0, 0, 0.3)"};

      &:disabled,
      &[disabled] {
        pointer-events: none;
        background-color: ${themeByVariant?.disabled?.background ||
        fade(background.contrast, 0.7)};
        color: ${themeByVariant?.disabled?.color ||
        (isDarkTheme ? primary.main : primary.dark)};
        border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
          ${themeByVariant?.disabled?.border?.color || "transparent"};
      }

      &:hover {
        background-color: ${themeByVariant?.hover?.background ||
        (isDarkTheme ? background.contrast : background.default)};
        color: ${themeByVariant?.hover?.color ||
        (isDarkTheme ? primary.light : primary.main)};
        border: ${themeByVariant?.hover?.border?.width || "1px"} solid
          ${themeByVariant?.hover?.border?.color || "transparent"};
      }

      &:active {
        background-color: ${themeByVariant?.active?.background ||
        (isDarkTheme ? background.contrastSecondary : background.secondary)};
        color: ${themeByVariant?.active?.color || primary.dark};
        border: ${themeByVariant?.active?.border?.width || "1px"} solid
          ${themeByVariant?.active?.border?.color || "transparent"};
      }

      &:focus {
        box-shadow: ${isDarkTheme
          ? "none"
          : `0 0 3px ${themeByVariant?.hover?.background || primary.main}`};
        outline: ${isDarkTheme
          ? `1px solid ${themeByVariant?.hover?.background || primary.light}`
          : "none"};
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
      background-color: ${themeByVariant?.background || "transparent"};
      color: ${themeByVariant?.color ||
      (isDarkTheme ? primary.main : primary.dark)};
      border: ${themeByVariant?.border?.width || "1px"} solid
        ${themeByVariant?.border?.color || "transparent"};
      border-radius: ${rounded
        ? "50%"
        : themeByVariant?.border?.radius || "5px"};

      &:disabled,
      &[disabled] {
        pointer-events: none;
        background-color: ${themeByVariant?.disabled?.background ||
        "transparent"};
        color: ${themeByVariant?.disabled?.color || text.disabled};
        border: ${themeByVariant?.disabled?.border?.width || "1px"} solid
          ${themeByVariant?.disabled?.border?.color || "transparent"};
      }

      &:hover {
        background-color: ${themeByVariant?.hover?.background || "transparent"};
        color: ${themeByVariant?.hover?.color ||
        (isDarkTheme ? primary.light : primary.main)};
        border: ${themeByVariant?.hover?.border?.width || "1px"} solid
          ${themeByVariant?.hover?.border?.color || "transparent"};
      }

      &:active {
        background-color: ${themeByVariant?.active?.background ||
        (isDarkTheme ? background.contrastSecondary : background.secondary)};
        color: ${themeByVariant?.active?.color || primary.dark};
        border: ${themeByVariant?.active?.border?.width || "1px"} solid
          ${themeByVariant?.active?.border?.color || "transparent"};
      }

      &:focus {
        box-shadow: ${isDarkTheme
          ? "none"
          : `0 0 3px ${themeByVariant?.hover?.background || primary.main}`};
        outline: ${isDarkTheme
          ? `1px solid ${themeByVariant?.hover?.background || primary.light}`
          : "none"};
      }
    `,
  };

  const iconButtonStyles = css`
    min-width: ${getHeightBySize(theme, size)};
    padding: 0;
  `;

  return cx(variants[variant], baseStyles(theme, size), iconButtonStyles);
};

type toggleButtonStylesProps = {
  variant: "filled" | "default" | "text";
  size: "small" | "base" | "large";
  rounded: boolean;
  isDisabled?: boolean;
  isSelected: boolean;
  styleLike: "button" | "iconButton";
};

export const defaultToggleButtonStyles = ({
  variant,
  size,
  styleLike,
  isSelected,
  isDisabled,
  rounded,
}: toggleButtonStylesProps): ThemeStyleFn => activeTheme => {
  const { isDarkTheme, theme } = activeTheme;
  const {
    palette: { primary, background, text },
  } = theme;

  const themeByVariant =
    variant !== "default"
      ? theme?.[styleLike]?.variants?.[variant]
      : theme.iconButton;

  const selectedStylesByVariantMap = {
    filled: css`
      background-color: ${themeByVariant?.hover?.background || primary.dark};
      color: ${themeByVariant?.hover?.color || primary.contrastText};
      &:disabled,
      &[disabled] {
        background-color: ${themeByVariant?.hover?.background ||
        primary.dark} !important;
        color: ${themeByVariant?.hover?.color ||
        primary.contrastText} !important;
        filter: opacity(70%) !important;
      }
    `,
    default: css`
      background-color: ${themeByVariant?.hover?.background ||
      (isDarkTheme ? fade(primary.dark, 0.25) : "transparent")};
      color: ${themeByVariant?.hover?.color || primary.main};
      &:disabled,
      &[disabled] {
        background-color: ${themeByVariant?.hover?.background ||
        (isDarkTheme ? fade(primary.dark, 0.25) : "transparent")} !important;
        color: ${themeByVariant?.hover?.color || primary.main} !important;
        filter: opacity(70%) !important;
      }
    `,
    text: css`
      background-color: ${themeByVariant?.hover?.background ||
      fade(theme.palette.primary.main, 0.2)};
      color: ${themeByVariant?.hover?.color ||
      (isDarkTheme ? primary.light : primary.main)};
      &:hover {
        background-color: ${themeByVariant?.hover?.background ||
        fade(theme.palette.primary.main, 0.5)};
        color: ${themeByVariant?.hover?.color || primary.dark};
        &:focus {
          box-shadow: none !important;
          border: 1px solid
            ${themeByVariant?.hover?.background ||
            (isDarkTheme ? background.contrast : "transparent")};
        }
      }
      &:disabled,
      &[disabled] {
        background-color: ${themeByVariant?.hover?.background ||
        (isDarkTheme ? background.contrast : "transparent")} !important;
        color: ${themeByVariant?.hover?.color ||
        (isDarkTheme ? primary.light : primary.main)} !important;
        filter: opacity(70%) !important;
      }
    `,
  };

  const stylesByVariantMap = {
    filled: "",
    default: css`
      color: ${themeByVariant?.color ||
      (isDarkTheme ? text.disabled : primary.dark)};
    `,
    text: "",
  };

  const styles =
    styleLike === "button" ? defaultStyles : defaultIconButtonStyles;
  return cx(
    styles({ variant, size, isDisabled, rounded })(activeTheme),
    stylesByVariantMap[variant],
    isSelected ? selectedStylesByVariantMap[variant] : ""
  );
};

export const defaultBadgeStyles = (pfx: string): ThemeStyleFn => ({ theme }) =>
  css`
    &.${pfx}-badge {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      padding: 0 ${theme.spacing.base};
      font-size: ${theme.typography.sizes.xs};
      color: ${theme.palette.secondary.contrastText};
      background: ${theme.palette.secondary.main};

      &.${pfx}-variant-undetermined {
        min-width: 8px;
        height: 8px;
      }

      &.${pfx}-placement-bottom-right {
        bottom: -4px;
        right: 0;

        &.${pfx}-variant-undetermined {
          bottom: 4px;
          right: 2px;
        }
      }

      &.${pfx}-placement-bottom-left {
        bottom: -4px;
        left: 0;

        &.${pfx}-variant-undetermined {
          bottom: 4px;
          left: 2px;
        }
      }

      &.${pfx}-placement-top-right {
        top: -4px;
        right: 0;

        &.${pfx}-variant-undetermined {
          top: 4px;
          right: 2px;
        }
      }

      &.${pfx}-placement-top-left {
        top: -4px;
        left: 0;

        &.${pfx}-variant-undetermined {
          top: 4px;
          left: 2px;
        }
      }
    }
  `;
