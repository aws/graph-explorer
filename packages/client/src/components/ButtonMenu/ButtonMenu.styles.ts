import { css } from "@emotion/css";
import { ActiveThemeType, ProcessedTheme } from "../../core";

type conatinerStylesParams = {
  classNamePrefix: string;
};

export const buttonMenuContainerStyles = ({
  classNamePrefix,
}: conatinerStylesParams) => (activeTheme: ActiveThemeType<ProcessedTheme>) =>
  css`
    display: flex;
    .${classNamePrefix}-button-menu {
      display: flex;
      align-items: center;
      color: ${activeTheme.theme.palette.text.primary};
    }

    .${classNamePrefix}-button-menu-dropdown-icon {
      font-size: 18px;
      flex-shrink: 1;
    }
  `;

const listStyles = css`
  max-height: 300px;
  overflow: auto;
  list-style: none;
  padding: 0;
  margin: 2px 0;
  outline: none;
`;

const listItemStyles = (pfx: string, isFocused: boolean) => (
  activeTheme: ActiveThemeType<ProcessedTheme>
) => {
  const {
    theme: { buttonMenu, palette, spacing, forms },
    isDarkTheme,
  } = activeTheme;
  return css`
    background: ${isFocused
      ? buttonMenu?.list?.item?.hover?.background ||
        (isDarkTheme
          ? palette.background.contrast
          : palette.background.contrastSecondary)
      : buttonMenu?.list?.item?.background ||
        (isDarkTheme
          ? palette.background.secondary
          : palette.background.contrast)};
    color: ${isFocused
      ? buttonMenu?.list?.item?.hover?.color || palette.text.primary
      : buttonMenu?.list?.item?.color || palette.text.primary};
    padding: ${spacing["2x"]};
    display: flex;
    align-items: center;
    cursor: pointer;
    outline: none;
    min-height: 40px;
    &:hover {
      background: ${buttonMenu?.list?.item?.hover?.background ||
      (isDarkTheme
        ? palette.background.contrast
        : palette.background.secondary)};
      color: ${buttonMenu?.list?.item?.hover?.color || palette.text.primary};
      svg {
        color: ${palette.primary.dark};
      }
    }

    &.${pfx}-buttonmenu-list-item-disabled {
      pointer-events: none;
      filter: opacity(
        ${buttonMenu?.list?.disabledopacity || forms?.disabledOpacity || "40%"}
      );
    }

    &.${pfx}-buttonmenu-list-item-selected {
      background: ${buttonMenu?.list?.item?.hover?.background ||
      (isDarkTheme
        ? palette.background.contrast
        : palette.background.secondary)};
      color: ${buttonMenu?.list?.item?.hover?.color || palette.text.primary};
      svg {
        color: ${palette.primary.dark};
      }
    }
  `;
};

const itemStyles = css`
  display: flex;
  align-items: center;
  width: 100%;
`;

const popoverWrapperStyles = (activeTheme: ActiveThemeType<ProcessedTheme>) => {
  const {
    theme: { buttonMenu, shape, shadow, palette },
    isDarkTheme,
  } = activeTheme;
  return css`
    min-width: 200px;
    border: 1px solid
      ${buttonMenu?.list?.borderColor || palette?.divider || "transparent"};
    border-radius: ${buttonMenu?.list?.borderRadius || shape.borderRadius};
    box-shadow: ${buttonMenu?.list?.boxShadow || shadow.md};
    background: ${buttonMenu?.list?.background ||
    (isDarkTheme ? palette.background.secondary : palette.background.contrast)};
  `;
};

const searchInputStyles = css`
  margin: 8px;
`;

const subMenuItem = css`
  width: 100%;
  button {
    width: 100%;
    height: auto;
    padding: 0;
  }
`;

const subMenuItemTitle = (pfx: string) => css`
  display: flex;
  align-items: center;
  width: 100%;
  .${pfx}-submenu-title {
    flex: 1;
    text-align: left;
  }
`;
const styles = {
  buttonMenuContainerStyles,
  listStyles,
  listItemStyles,
  itemStyles,
  popoverWrapperStyles,
  searchInputStyles,
  subMenuItem,
  subMenuItemTitle,
};

export default styles;
