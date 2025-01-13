import { css } from "@emotion/css";
import type { ActiveThemeType } from "@/core";
import getSelectThemeWithDefaults from "./utils/getThemeWithDefaultValues";

const getPaddingBySize = (size: "sm" | "md", activeTheme: ActiveThemeType) => {
  const { theme } = activeTheme;
  const basePadding = theme.spacing["2x"];
  if (size === "sm") {
    return `calc(${basePadding} / 2)`;
  }

  return basePadding;
};

const getPaddingBySizeAndAdornment = (
  activeTheme: ActiveThemeType,
  size: "sm" | "md",
  hasInnerLabel?: boolean
) => {
  const padding = getPaddingBySize(size, activeTheme);
  if (hasInnerLabel) {
    return `calc(${padding} + 4px) calc(${padding} + "20px") calc(${padding} - 4px) ${padding}`;
  }
  return `${padding} calc(${padding} + "20px") ${padding} ${padding}`;
};

const getInnerLabelStyles = (
  size: "sm" | "md",
  activeTheme: ActiveThemeType
) => css`
  position: absolute;
  cursor: pointer;
  z-index: 10;
  top: ${size === "sm" ? "2px" : "4px"};
  left: calc(${getPaddingBySize(size, activeTheme)});
`;

type containerStylesParams = {
  labelPlacement: "top" | "inner";
  size: "sm" | "md";
  validationState?: "invalid" | "valid";
  hideError?: boolean;
  noMargin?: boolean;
  variant: "default" | "text";
  minWidth?: number;
};

export const getStylesByVariantAndValidationState =
  (
    variant: containerStylesParams["variant"],
    validationState: containerStylesParams["validationState"]
  ) =>
  (activeTheme: ActiveThemeType) => {
    const themeWithDefault = getSelectThemeWithDefaults(
      activeTheme,
      validationState || "valid"
    )(variant);
    return css`
      cursor: pointer;
      > .input-label {
        color: ${themeWithDefault.label?.color};
      }

      .select {
        color: ${themeWithDefault.color};
        border-radius: ${themeWithDefault.borderRadius};
        border: ${themeWithDefault.border};
        background-color: ${themeWithDefault.background};

        &:hover {
          background-color: ${themeWithDefault.hover?.background};
          color: ${themeWithDefault.hover?.color};
        }

        &:focus {
          background-color: ${themeWithDefault.focus?.background};
          color: ${themeWithDefault.focus?.color};
          outline: none;
          box-shadow: ${themeWithDefault.focus?.outlineColor};
        }
      }

      .placeholder {
        color: ${themeWithDefault.placeholderColor};
      }

      .input-error {
        color: ${themeWithDefault.error?.errorColor};
      }
    `;
  };

export const selectContainerStyles =
  ({
    labelPlacement,
    size,
    hideError,
    noMargin,
    validationState,
    variant,
  }: containerStylesParams) =>
  (activeTheme: ActiveThemeType) => {
    const { theme } = activeTheme;
    return css`
      display: flex;
      position: relative;
      width: 100%;
      flex-direction: column;
      align-items: initial;
      margin-bottom: ${noMargin ? "0" : "14px"};
      cursor: pointer;

      &.select-label-left {
        flex-direction: row;
        align-items: center;
        > .input-label {
          width: 150px;
          line-height: 0.75em;
        }
      }

      &.select-label-inner {
        > .input-label {
          font-size: 10px;
          pointer-events: none;
          ${getInnerLabelStyles(size, activeTheme)}
        }
      }

      &.select-readonly {
        pointer-events: none;
      }

      > .input-label {
        width: 100%;
        line-height: 0.875em;
        font-size: 0.875em;
        margin: 0 0 8px 0;
      }

      .input-container {
        flex: 1;
        display: flex;
        position: relative;
      }

      &.select-disabled {
        .select {
          filter: opacity(${theme.forms?.disabledOpacity || "70%"});
          pointer-events: none;
        }
      }
      .select {
        text-align: left;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        margin-bottom: ${!hideError ? "4px" : "0"};
        padding: ${getPaddingBySizeAndAdornment(
          activeTheme,
          size,
          labelPlacement === "inner"
        )};
        flex: 1;

        &.no-options {
          padding-right: ${getPaddingBySize(size, activeTheme)};
        }
      }

      .input-error {
        position: absolute;
        bottom: -14px;
        left: 0;
        font-size: 0.75em;
      }

      ${getStylesByVariantAndValidationState(
        variant,
        validationState
      )(activeTheme)}
      .dropdown-indicator {
        position: absolute;
        right: calc(${getPaddingBySize(size, activeTheme)});
        top: ${labelPlacement === "inner" ? "calc(50% + 4px)" : "50%"};
        display: flex;
        align-items: center;
        transform: translate(0, -50%);
        border: none;
        background-color: transparent;
        margin-right: 0;

        .clear-button {
          margin-right: -10px;
        }
        .clear-button:hover {
          background-color: transparent;
        }
      }
    `;
  };

const searchInputStyles = (activeTheme: ActiveThemeType) => {
  const themeWithDefault = getSelectThemeWithDefaults(
    activeTheme,
    "valid"
  )("default");
  return css`
    padding: 8px;
    background-color: ${themeWithDefault.list?.search?.background};
  `;
};

const multipleSelectedValuesWrapper = ({ theme }: ActiveThemeType) => css`
  display: flex;
  gap: ${theme.spacing.base};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const styles = {
  selectContainerStyles,
  searchInputStyles,
  multipleSelectedValuesWrapper,
};

export default styles;
