import { css } from "@emotion/css";
import type { ReactNode } from "react";
import type { ActiveThemeType, ProcessedTheme } from "../../core";
import { fade } from "../../core";
import { memoize } from "../../utils";
import { InputTheme } from "./Input.model";

export const getInputThemeWithDefaults = memoize(
  (
    activeTheme: ActiveThemeType<ProcessedTheme<InputTheme>>,
    validationState: "valid" | "invalid"
  ): InputTheme["input"] => {
    const { isDarkTheme, theme } = activeTheme;
    const { palette } = theme;
    const { text, background, primary, error } = palette;
    const baseFormTheme = theme.forms;
    const inputTheme = theme.input;
    const styleByValidationState = {
      invalid: {
        color:
          inputTheme?.error?.labelColor ||
          baseFormTheme?.error?.labelColor ||
          error.main,
        input: {
          background:
            inputTheme?.error?.background ||
            baseFormTheme?.error?.background ||
            background.contrast,
          color:
            inputTheme?.error?.color ||
            baseFormTheme?.error?.color ||
            text.primary,
          border:
            inputTheme?.error?.border ||
            baseFormTheme?.error?.border ||
            `1px solid ${error.main}`,
          placeholder:
            inputTheme?.error?.placeholderColor ||
            baseFormTheme?.error?.placeholderColor ||
            inputTheme?.placeholderColor ||
            baseFormTheme?.placeholderColor ||
            text.disabled,
          focus: {
            shadow:
              inputTheme?.error?.focus?.outlineColor ||
              baseFormTheme?.error?.focus?.outlineColor ||
              error.main,
          },
        },
      },
      valid: {
        color:
          inputTheme?.label?.color ||
          baseFormTheme?.label?.color ||
          text.primary,
        input: {
          background:
            inputTheme?.background ||
            baseFormTheme?.background ||
            background.contrast,
          color: inputTheme?.color || baseFormTheme?.color || text.primary,
          border:
            inputTheme?.border ||
            baseFormTheme?.border ||
            "1px solid transparent",
          placeholder:
            inputTheme?.placeholderColor ||
            baseFormTheme?.placeholderColor ||
            text.disabled,
          focus: {
            shadow:
              inputTheme?.error?.focus?.outlineColor ||
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
      borderRadius:
        inputTheme?.borderRadius ||
        baseFormTheme?.borderRadius ||
        theme.shape.borderRadius,
      disabledOpacity:
        inputTheme?.disabledOpacity || baseFormTheme?.disabledOpacity || "70%",
      padding: "0",
      paddingSmall: "0",
      startAdornment: {
        color:
          baseFormTheme?.startAdornment?.color ||
          inputTheme?.startAdornment?.color ||
          text.primary,
      },
      endAdornment: {
        color:
          baseFormTheme?.endAdornment?.color ||
          inputTheme?.endAdornment?.color ||
          text.primary,
      },
      focus: {
        outlineColor: `0 0 0 1px
          ${
            styleByValidationState[validationState || "valid"].input.focus
              .shadow
          }`,
        background:
          inputTheme?.focus?.background ||
          baseFormTheme?.focus?.background ||
          background.contrastSecondary,
        color:
          inputTheme?.focus?.color ||
          baseFormTheme?.focus?.color ||
          text.primary,
      },
      hover: {
        background:
          inputTheme?.hover?.background ||
          baseFormTheme?.hover?.background ||
          background.contrastSecondary,
        color:
          inputTheme?.hover?.color ||
          baseFormTheme?.hover?.color ||
          text.primary,
      },
      label: {
        color: styleByValidationState[validationState].color,
      },
      error: {
        errorColor:
          inputTheme?.error?.errorColor ||
          baseFormTheme?.error?.errorColor ||
          error.main,
      },
    };
  }
);

const getPaddingBySize = (size: "sm" | "md", theme: ProcessedTheme) => {
  const basePadding = theme.input?.padding || theme.spacing["2x"];
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

export const inputContainerStyles = (
  labelPlacement: "top" | "left" | "inner",
  classNamePrefix: string,
  size: "sm" | "md",
  isDisabled?: boolean,
  validationState?: "invalid" | "valid",
  fullWidth?: boolean,
  hideError?: boolean,
  isReadOnly?: boolean,
  startAdornment?: ReactNode,
  endAdornment?: ReactNode,
  isTextArea?: boolean,
  noMargin?: boolean
) => (activeTheme: ActiveThemeType<ProcessedTheme>) => {
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

    &.${classNamePrefix}-input-label-inner {
      > .${classNamePrefix}-input-label {
        font-size: 10px;
        pointer-events: none;
        ${getInnerLabelStyles(size, theme)}
      }
    }

    > .${classNamePrefix}-input-label {
      width: ${labelPlacement === "left" ? "150px" : "100%"};
      line-height: ${labelPlacement === "left" ? "0.75em" : "0.875em"};
      color: ${themeWithDefault?.label?.color};
      font-size: 0.875em;
      margin: ${labelPlacement === "left" ? "0 8px 0 0" : "0 0 8px 0"};
    }

    .${classNamePrefix}-input-container {
      flex: 1;
      display: flex;
      position: relative;
    }

    .${classNamePrefix}-start-adornment {
      position: absolute;
      left: ${getPaddingBySize(size, theme)};
      top: ${isTextArea ? `calc(${getPaddingBySize(size, theme)} + 2px)` : "0"};
      height: ${!hideError ? "calc(100% - 8px)" : "100%"};
      display: flex;
      align-items: center;
      color: ${themeWithDefault?.startAdornment?.color};
    }

    .${classNamePrefix}-end-adornment {
      position: absolute;
      right: ${getPaddingBySize(size, theme)};
      top: ${isTextArea ? `calc(${getPaddingBySize(size, theme)} + 2px)` : "0"};
      height: ${!hideError ? "calc(100% - 8px)" : "100%"};
      display: flex;
      align-items: center;
      color: ${themeWithDefault?.endAdornment?.color};
    }

    .${classNamePrefix}-clearButton {
      position: absolute;
      right: ${getPaddingBySize(size, theme)};
      top: ${isTextArea ? `calc(${getPaddingBySize(size, theme)} + 2px)` : "0"};
      height: ${!hideError ? "calc(100% - 8px)" : "100%"};
      display: flex;
      align-items: center;
      color: ${themeWithDefault?.endAdornment?.color};
    }

    .${classNamePrefix}-input {
      font-family: inherit;
      ${isTextArea && "height: 100px; resize: none;"}
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

      &:not(.${classNamePrefix}-input-disabled):hover {
        background-color: ${themeWithDefault?.hover?.background};
        color: ${themeWithDefault?.hover?.color};
      }
      &:focus {
        background-color: ${themeWithDefault?.focus?.background};
        color: ${themeWithDefault?.focus?.color};
        outline: none;
        box-shadow: ${themeWithDefault?.focus?.outlineColor};
      }
    }

    .${classNamePrefix}-input-error {
      position: absolute;
      top: calc(100% - 6px);
      left: 0;
      color: ${themeWithDefault?.error?.errorColor};
      font-size: 0.75em;
    }
  `;
};
