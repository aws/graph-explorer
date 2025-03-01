import { css } from "@emotion/css";
import type { ReactNode } from "react";
import type { ActiveThemeType, ProcessedTheme } from "@/core";
import { fade } from "@/core";
import { memoize } from "@/utils";
import { TextAreaTheme } from "./TextArea.model";

export const getInputThemeWithDefaults = memoize(
  (
    activeTheme: ActiveThemeType,
    validationState: "valid" | "invalid"
  ): TextAreaTheme["textArea"] => {
    const { isDarkTheme, theme } = activeTheme;
    const { palette } = theme;
    const { text, background, primary, error } = palette;
    const baseFormTheme = theme.forms;
    const styleByValidationState = {
      invalid: {
        color: baseFormTheme?.error?.labelColor || error.main,
        input: {
          background: baseFormTheme?.error?.background || background.contrast,
          color: baseFormTheme?.error?.color || text.primary,
          border: baseFormTheme?.error?.border || `1px solid ${error.main}`,
          placeholder:
            baseFormTheme?.error?.placeholderColor ||
            baseFormTheme?.placeholderColor ||
            text.disabled,
          focus: {
            shadow: baseFormTheme?.error?.focus?.outlineColor || error.main,
          },
        },
      },
      valid: {
        color: baseFormTheme?.label?.color || text.primary,
        input: {
          background: baseFormTheme?.background || background.contrast,
          color: baseFormTheme?.color || text.primary,
          border: baseFormTheme?.border || "1px solid transparent",
          placeholder: baseFormTheme?.placeholderColor || text.disabled,
          focus: {
            shadow:
              baseFormTheme?.error?.focus?.outlineColor ||
              (isDarkTheme ? primary.dark : primary.main),
          },
        },
      },
    };

    return {
      background: styleByValidationState[validationState].input.background,
      color: styleByValidationState[validationState].input.color,
      placeholderColor:
        styleByValidationState[validationState].input.placeholder,
      border: styleByValidationState[validationState].input.border,
      borderRadius: baseFormTheme?.borderRadius || theme.shape.borderRadius,
      disabledOpacity: baseFormTheme?.disabledOpacity || "70%",
      padding: "0",
      paddingSmall: "0",
      startAdornment: {
        color: baseFormTheme?.startAdornment?.color || text.primary,
      },
      endAdornment: {
        color: baseFormTheme?.endAdornment?.color || text.primary,
      },
      focus: {
        outlineColor: `0 0 0 1px
          ${
            styleByValidationState[validationState || "valid"].input.focus
              .shadow
          }`,
        background:
          baseFormTheme?.focus?.background || background.contrastSecondary,
        color: baseFormTheme?.focus?.color || text.primary,
      },
      hover: {
        background:
          baseFormTheme?.hover?.background || background.contrastSecondary,
        color: baseFormTheme?.hover?.color || text.primary,
      },
      label: {
        color: styleByValidationState[validationState].color,
      },
      error: {
        errorColor: baseFormTheme?.error?.errorColor || error.main,
      },
    };
  }
);

const getPaddingBySize = (size: "sm" | "md", theme: ProcessedTheme) => {
  const basePadding = theme.spacing["2x"];
  if (size === "sm") {
    return `calc(${basePadding} / 2)`;
  }

  return basePadding;
};
const getPaddingBySizeAndAdornment = (
  theme: ProcessedTheme,
  size: "sm" | "md",
  startAdornment?: ReactNode,
  endAdornment?: ReactNode,
  hasInnerLabel?: boolean
) => {
  const padding = getPaddingBySize(size, theme);
  const paddingTop = hasInnerLabel ? `calc(${padding} + 4px)` : padding;
  const paddingBottom = hasInnerLabel ? `calc(${padding} - 4px)` : padding;
  if (!!startAdornment && !endAdornment) {
    return `${paddingTop} ${padding} ${paddingBottom} calc(${padding} + 20px)`;
  }

  if (!startAdornment && !!endAdornment) {
    return `${paddingTop} calc(${padding} + 20px) ${paddingBottom} ${padding}`;
  }

  if (!!startAdornment && !!endAdornment) {
    return `${paddingTop} calc(${padding} + 20px) ${paddingBottom} calc(${padding} + 20px)`;
  }

  return `${paddingTop} ${padding} ${paddingBottom} ${padding}`;
};

const getInnerLabelStyles = (
  size: "sm" | "md",
  activeTheme: ProcessedTheme
) => css`
  position: absolute;
  cursor: pointer;
  z-index: 10;
  top: ${size === "sm" ? "2px" : "4px"};
  left: calc(${getPaddingBySize(size, activeTheme)});
`;

export const textAreaContainerStyles =
  (
    labelPlacement: "top" | "left" | "inner",
    size: "sm" | "md",
    isDisabled?: boolean,
    validationState?: "invalid" | "valid",
    fullWidth?: boolean,
    hideError?: boolean,
    isReadOnly?: boolean,
    startAdornment?: ReactNode,
    endAdornment?: ReactNode,
    noMargin?: boolean
  ) =>
  (activeTheme: ActiveThemeType) => {
    const { theme } = activeTheme;
    const themeWithDefault = getInputThemeWithDefaults(
      activeTheme,
      validationState || "valid"
    );
    return css`
      display: flex;
      flex-direction: ${labelPlacement === "left" ? "row" : "column"};
      align-items: ${labelPlacement === "left" ? "center" : "initial"};
      margin-bottom: ${noMargin ? "0" : "14px"};
      ${fullWidth ? "flex-grow: 1" : ""};
      ${fullWidth ? "width: 100%" : ""};
      ${isReadOnly ? "pointer-events: none" : ""};
      position: relative;

      &.input-label-inner {
        > .input-label {
          font-size: 10px;
          pointer-events: none;
          ${getInnerLabelStyles(size, theme)}
        }
      }

      > .input-label {
        width: ${labelPlacement === "left" ? "150px" : "100%"};
        line-height: ${labelPlacement === "left" ? "0.75em" : "0.875em"};
        color: ${themeWithDefault?.label?.color};
        font-size: 0.875em;
        margin: ${labelPlacement === "left" ? "0 8px 0 0" : "0 0 8px 0"};
      }

      .input-container {
        flex: 1;
        display: flex;
        position: relative;
        align-items: center;
      }

      .start-adornment {
        position: absolute;
        left: ${getPaddingBySize(size, theme)};
        top: calc(${getPaddingBySize(size, theme)} + 2px);
        height: ${!hideError ? "calc(100% - 8px)" : "100%"};
        display: flex;
        align-items: center;
        color: ${themeWithDefault?.startAdornment?.color};
      }

      .end-adornment {
        position: absolute;
        right: ${getPaddingBySize(size, theme)};
        top: calc(${getPaddingBySize(size, theme)} + 2px);
        height: ${!hideError ? "calc(100% - 8px)" : "100%"};
        display: flex;
        align-items: center;
        color: ${themeWithDefault?.endAdornment?.color};
      }

      .clearButton {
        position: absolute;
        right: ${getPaddingBySize(size, theme)};
        top: calc(${getPaddingBySize(size, theme)} + 2px);
        height: ${!hideError ? "calc(100% - 8px)" : "100%"};
        display: flex;
        align-items: center;
        color: ${themeWithDefault?.endAdornment?.color};
      }

      .input {
        height: 100px;
        resize: none;
        background-color: ${!isDisabled
          ? themeWithDefault?.background
          : fade(themeWithDefault?.background, 0.7)};
        color: ${!isDisabled
          ? themeWithDefault?.color
          : fade(themeWithDefault?.color, 0.5)};
        border-radius: ${themeWithDefault?.borderRadius};
        margin-bottom: ${!hideError ? "8px" : "0"};
        padding: ${getPaddingBySizeAndAdornment(
          theme,
          size,
          startAdornment,
          endAdornment,
          labelPlacement === "inner"
        )};
        flex: 1;
        border: ${themeWithDefault?.border};
        width: 100%;

        &::placeholder {
          color: ${themeWithDefault?.placeholderColor};
        }

        &:not(.input-disabled):hover {
          background-color: ${themeWithDefault?.hover?.background};
          color: ${themeWithDefault?.hover?.color};
        }
        &:focus {
          background-color: ${themeWithDefault?.focus?.background};
          color: ${themeWithDefault?.focus?.color};
        }
        &:focus-visible {
          outline: none;
          box-shadow: ${themeWithDefault?.focus?.outlineColor};
        }
      }

      .input-error {
        position: absolute;
        top: calc(100% - 6px);
        left: 0;
        color: ${themeWithDefault?.error?.errorColor};
        font-size: 0.75em;
      }
    `;
  };
