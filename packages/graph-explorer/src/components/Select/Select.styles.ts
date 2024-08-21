import { css } from "@emotion/css";
import type { ActiveThemeType, ProcessedTheme } from "@/core";
import getSelectThemeWithDefaults from "./utils/getThemeWithDefaultValues";

const getPaddingBySize = (
  size: "sm" | "md",
  activeTheme: ActiveThemeType<ProcessedTheme>
) => {
  const { theme } = activeTheme;
  const basePadding = theme.select?.padding || theme.spacing["2x"];
  if (size === "sm") {
    return `calc(${basePadding} / 2)`;
  }

  return basePadding;
};

const getPaddingBySizeAndAdornment = (
  activeTheme: ActiveThemeType<ProcessedTheme>,
  size: "sm" | "md",
  hasInnerLabel?: boolean,
  clearable?: boolean
) => {
  const padding = getPaddingBySize(size, activeTheme);
  if (hasInnerLabel) {
    return `calc(${padding} + 4px) calc(${padding} + ${
      clearable ? "30px" : "20px"
    }) calc(${padding} - 4px) ${padding}`;
  }
  return `${padding} calc(${padding} + ${
    clearable ? "30px" : "20px"
  }) ${padding} ${padding}`;
};

const getInnerLabelStyles = (
  size: "sm" | "md",
  activeTheme: ActiveThemeType<ProcessedTheme>
) => css`
  position: absolute;
  cursor: pointer;
  z-index: 10;
  top: ${size === "sm" ? "2px" : "4px"};
  left: calc(${getPaddingBySize(size, activeTheme)});
`;

type containerStylesParams = {
  labelPlacement: "top" | "left" | "inner";
  size: "sm" | "md";
  validationState?: "invalid" | "valid";
  hideError?: boolean;
  noMargin?: boolean;
  variant: "default" | "text";
  minWidth?: number;
  clearable?: boolean;
};

export const getStylesByVariantAndValidationState =
  (
    variant: containerStylesParams["variant"],
    validationState: containerStylesParams["validationState"]
  ) =>
  (activeTheme: ActiveThemeType<ProcessedTheme>) => {
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
    clearable,
  }: containerStylesParams) =>
  (activeTheme: ActiveThemeType<ProcessedTheme>) => {
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
          filter: opacity(
            ${theme.select?.disabledOpacity ||
            theme.forms?.disabledOpacity ||
            "70%"}
          );
          pointer-events: none;
        }
      }
      .select {
        font-family: inherit;
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
          labelPlacement === "inner",
          clearable
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

const listStyles = () => css`
  max-height: 300px;
  overflow: auto;
  list-style: none;
  padding: 0;
  margin: 2px 0;
  outline: none;
`;

const listItemStyles = () => (activeTheme: ActiveThemeType<ProcessedTheme>) => {
  const themeWithDefault = getSelectThemeWithDefaults(
    activeTheme,
    "valid"
  )("default");

  const { theme } = activeTheme;
  return css`
    background: ${themeWithDefault.list?.item?.background};
    color: ${themeWithDefault.list?.item?.color};
    padding: 8px;
    display: flex;
    align-items: center;
    cursor: pointer;
    outline: none;

    &:focus:not(.select-list-item-selected),
    &.select-list-item-focused {
      background: ${themeWithDefault.list?.item?.hover?.background};
      color: ${themeWithDefault.list?.item?.hover?.color};
    }

    &:hover {
      background: ${themeWithDefault.list?.item?.hover?.background};
      color: ${themeWithDefault.list?.item?.hover?.color};
    }

    &.select-list-item-selected {
      background: ${themeWithDefault.list?.item?.selected?.background};
      color: ${themeWithDefault.list?.item?.selected?.color};
      &:hover {
        background: ${themeWithDefault.list?.item?.selected?.background};
        color: ${themeWithDefault.list?.item?.selected?.color};
      }
    }

    &.select-list-item-disabled {
      pointer-events: none;
      filter: opacity(
        ${theme.forms?.disabledOpacity ||
        theme?.select?.disabledOpacity ||
        "40%"}
      );
    }
  `;
};

const itemStyles = () => css`
  display: flex;
  align-items: center;
  width: 100%;
`;

const searchInputStyles = (activeTheme: ActiveThemeType<ProcessedTheme>) => {
  const themeWithDefault = getSelectThemeWithDefaults(
    activeTheme,
    "valid"
  )("default");
  return css`
    padding: 8px;
    background-color: ${themeWithDefault.list?.search?.background};
  `;
};

const popoverWrapperStyles = (activeTheme: ActiveThemeType<ProcessedTheme>) => {
  const themeWithDefault = getSelectThemeWithDefaults(
    activeTheme,
    "valid"
  )("default");

  return css`
    position: absolute;
    // TODO - review zIndexes when Select is inside a popover
    z-index: 9999999999;
    width: 100%;
    border: 1px solid ${themeWithDefault.list?.borderColor};
    border-radius: ${themeWithDefault.list?.borderRadius};
    box-shadow: ${themeWithDefault.list?.boxShadow};
    background: ${themeWithDefault.list?.background};
  `;
};

const multipleSelectedValuesWrapper = ({
  theme,
}: ActiveThemeType<ProcessedTheme>) => css`
  display: flex;
  gap: ${theme.spacing.base};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const styles = {
  selectContainerStyles,
  listStyles,
  listItemStyles,
  itemStyles,
  searchInputStyles,
  popoverWrapperStyles,
  multipleSelectedValuesWrapper,
};

export default styles;
