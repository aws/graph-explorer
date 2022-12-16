import { css } from "@emotion/css";
import { ThemeStyleFn } from "../../core";

const listStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) => {
  const { palette, shape, advancedList } = theme;
  const { primary, background, text, grey } = palette;

  return css`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: ${advancedList?.background || isDarkTheme
      ? palette.background.secondary
      : palette.background.contrast};

    color: ${advancedList?.color || text.primary};

    .${pfx}-advanced-list-loading {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 40px;
    }

    .${pfx}-advanced-list-search-wrapper {
      display: flex;
      align-items: center;
      .${pfx}-advanced-list-search-input {
        flex: 2;
      }

      .${pfx}-advanced-list-category-select {
        flex: 1;
      }

      .${pfx}-select {
        min-width: 0;
      }
    }

    .${pfx}-advanced-list-no-groups {
      padding: 0 5px;
    }

    .${pfx}-advanced-list-item-wrapper {
      padding: 5px;
    }

    .${pfx}-advanced-list-item {
      user-select: auto;
      border: 1px solid ${advancedList?.item?.borderColor || "transparent"};
      border-radius: ${advancedList?.item?.borderRadius || shape.borderRadius};
      background-color: ${advancedList?.background || isDarkTheme
        ? grey["800"]
        : background.contrast};
      padding: 0;
      align-items: normal;
      margin: 0 0 10px 0;
      color: ${advancedList?.item?.color || text.primary};

      &.${pfx}-advanced-list-item-selected {
        background: ${advancedList?.item?.hover?.background || isDarkTheme
          ? background.contrast
          : background.default || "rgba(18, 142, 229, 0.05)"};
        color: ${advancedList?.item?.hover?.color || text.primary};
        border: solid 1px
          ${advancedList?.item?.hover?.borderColor || primary.dark};

        .${pfx}-end-adornment {
          color: ${advancedList?.item?.color || primary.main};
        }
      }
      &.${pfx}-advanced-list-item-active {
        border: solid 2px
          ${advancedList?.item?.hover?.borderColor || primary.dark};
      }

      .${pfx}-primary {
        font-weight: 600;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-all;
      }
      .${pfx}-content {
        flex: 1;
      }

      .${pfx}-secondary {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-all;
      }
      .sidebar-highlight {
        color: ${advancedList?.item?.highlight?.color || primary.main};
        background: ${advancedList?.item?.highlight?.background ||
        "transparent"};
      }

      &:hover {
        background: ${advancedList?.item?.hover?.background || isDarkTheme
          ? background.contrast
          : background.default};
        color: ${advancedList?.item?.hover?.color || "inherit"};
        border: solid 1px
          ${advancedList?.item?.hover?.borderColor || primary.dark};

        .${pfx}-end-adornment {
          color: ${advancedList?.item?.color || primary.main};
        }
      }

      .${pfx}-end-adornment {
        font-size: 20px;
        color: ${advancedList?.item?.color || palette.border};
      }

      .${pfx}-content {
        min-height: 44px;
        border-radius: ${advancedList?.item?.borderRadius ||
        shape.borderRadius};
        background: transparent;
      }

      .${pfx}-start-adornment {
        color: ${advancedList?.item?.adornment?.color || primary.main};
        font-size: 20px;
        margin: 0;
        background-color: ${advancedList?.item?.adornment?.background ||
        background.secondary};
        border-top-left-radius: ${advancedList?.item?.borderRadius ||
        shape.borderRadius};
        border-bottom-left-radius: ${advancedList?.item?.borderRadius ||
        shape.borderRadius};
        margin-right: 6px;
      }
    }

    .${pfx}-advanced-list-item:last-child {
      margin: 0;
    }

    .${pfx}-advanced-list-item-with-popover {
      margin: 0 !important;
    }

    .${pfx}-advanced-list-item-wrapper {
      margin-bottom: 10px;
    }
    .${pfx}-advanced-list-item-wrapper:last-child {
      margin: 0;
    }

    .${pfx}-advanced-list-category {
      border: none;
      padding: 5px 0;

      &.${pfx}-advanced-list-category {
        padding: 0 0 5px 0;
      }
      .${pfx}-header-container {
        padding: 0;
        font-size: 14px;
        font-weight: 500;
        align-items: center;
        background-color: ${advancedList?.category?.background ||
        background.secondary};
        height: 24px;
        min-height: 24px;
      }

      .${pfx}-title {
        display: flex;
        align-items: center;
        line-height: 16px;
        color: ${advancedList?.category?.color || isDarkTheme
          ? text.secondary
          : primary.dark};
        padding: 0;
        font-size: 12px;

        svg {
          font-size: 18px;
          margin-right: 4px;
          margin-top: 2px;
        }
      }

      .${pfx}-collapsible-container:not(.${pfx}-collapsed) {
        padding: 12px;
      }
    }

    .${pfx}-advanced-list-nogroup {
      width: 100%;
      height: 100%;
      .${pfx}-advanced-list-item-wrapper {
        padding: 0px;
      }
      .${pfx}-advanced-list-nogroup-item-wrapper {
        padding: 5px 0;
      }
    }

    .${pfx}-advanced-list-item-no-category {
      padding: 5px 0;
    }

    .${pfx}-panel-empty-state-wrapper {
      height: max(448px, 100%);
    }
  `;
};

const headerStyles = (pfx: string, noSearchResults: boolean): ThemeStyleFn => ({
  theme,
  isDarkTheme,
}) =>
  css`
    flex: 1;
    height: 100%;
    .${pfx}-header-container {
      height: 48px;
      min-height: 48px;
      font-size: 16px;
      padding: 0 14px;
      font-weight: 500;
      align-items: center;
      background-color: ${isDarkTheme
        ? theme.palette.background.secondary
        : theme.palette.background.default};
    }

    .${pfx}-title {
      padding: 10px 0;
    }

    > .${pfx}-content {
      overflow: auto;
      height: 100%;
      background: ${noSearchResults
        ? theme.palette.background.secondary
        : theme.palette.background.default};
    }
  `;

const footerStyles = (pfx: string): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    border-top: solid 1px ${theme.palette.border};

    .${pfx}-header-container {
      height: 48px;
      padding: 0 14px;
      font-weight: 500;
      align-items: center;

      background-color: ${isDarkTheme
        ? theme.palette.background.secondary
        : theme.palette.background.default};
    }

    .${pfx}-title {
      padding: 10px 0;
      color: ${theme.palette.text.secondary};
      font-size: 14px;
    }
  `;

const styles = {
  footerStyles,
  headerStyles,
  listStyles,
};

export default styles;
