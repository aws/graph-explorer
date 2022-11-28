import { css } from "@emotion/css";

import { fade, ThemeStyleFn } from "../../core";
import { TabularTheme } from "./Tabular.model";
import baseTheme from "./baseTheme";

const defaultStyles = (
  pfx: string,
  variant: "bordered" | "noBorders" = "bordered"
): ThemeStyleFn<TabularTheme> => ({ theme, isDarkTheme }) => {
  const { tabular, palette } = theme;

  return css`
    max-width: 100%;
    overflow: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 100%;
    height: 100%;
    background: ${tabular?.background || palette.background.default};
    color: ${tabular?.color || palette.text.primary};

    .${pfx}-table {
      flex-grow: 1;
      width: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .${pfx}-headers {
      box-sizing: border-box;
      width: fit-content;
      min-width: 100%;
      background: ${tabular?.header?.background ||
      (isDarkTheme ? palette.grey[800] : palette.background.contrast)};
      color: ${tabular?.header?.color || palette.text.secondary};
      border: ${tabular?.header?.border || `solid 1px ${palette.border}`};
      ${variant === "noBorders" && `border-right: none; border-left: none;`}
      min-height: ${tabular?.header?.minHeight || baseTheme.header.minHeight};

      .${pfx}-row:last-child {
        border-bottom: none;
      }
    }

    .${pfx}-headers-sticky {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .${pfx}-row {
      box-sizing: border-box;
      min-height: ${tabular?.row?.minHeight || baseTheme.row.minHeight};
      border-bottom: ${variant === "bordered"
        ? tabular?.row?.border ||
          tabular?.border ||
          `solid 1px ${palette.border}`
        : "none"};
      flex-grow: 0 !important;
      transition: background-color 250ms ease;

      :first-child {
        border-top: ${tabular?.row?.border ||
        tabular?.border ||
        `solid 1px ${palette.border}`};
      }

      :hover {
        background: ${tabular?.row?.hover?.background ||
        (isDarkTheme ? palette.grey[800] : palette.background.contrast)};
        color: ${tabular?.row?.hover?.background || palette.text.primary};
      }

      :first-child {
        border-top: none;
      }
    }

    .${pfx}-row-grow {
      flex-grow: 1 !important;
    }

    .${pfx}-row-selectable {
      background: ${tabular?.row?.selectable?.background ||
      baseTheme.row.selectable.background};
      color: ${tabular?.row?.selectable?.color ||
      baseTheme.row.selectable.color};
      :hover {
        background: ${tabular?.row?.selectable?.hover?.background ||
        baseTheme.row.selectable.hover.background};
        color: ${tabular?.row?.selectable?.hover?.color ||
        palette.primary.dark};
        cursor: pointer;
      }
    }

    .${pfx}-row-selected {
      background: ${tabular?.row?.selected?.background ||
      fade(palette.primary.main, 0.25)};
      color: ${tabular?.row?.selected?.color || baseTheme.row.selected.color};
    }

    .${pfx}-header {
      display: flex;
      flex-direction: column;
      padding: ${tabular?.header?.padding || baseTheme.header.padding};
      border-right: ${variant === "bordered"
        ? tabular?.header?.border || `1px solid ${palette.border}`
        : "none"};
      background: ${tabular?.header?.background ||
      (isDarkTheme ? palette.grey[800] : palette.background.contrast)};
      color: ${tabular?.header?.color || baseTheme.header.color};
      transition: background 250ms ease-in, border 250ms ease-in;
    }

    .${pfx}-header-label {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      flex-grow: 1;
      width: 100%;
      font-weight: ${tabular?.header?.label?.fontWeight ||
      baseTheme.header.label.fontWeight};
      min-height: ${tabular?.header?.label?.minHeight ||
      baseTheme.header.label.minHeight};
      margin: ${tabular?.header?.label?.margin ||
      baseTheme.header.label.margin};
      padding: ${tabular?.header?.label?.padding ||
      baseTheme.header.label.padding};
    }

    .${pfx}-header-filter {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-grow: 1;
      width: 100%;
      min-height: ${tabular?.header?.filter?.minHeight ||
      baseTheme.header.filter.minHeight};
      margin: ${tabular?.header?.filter?.margin ||
      baseTheme.header.filter.margin};
      padding: ${tabular?.header?.filter?.padding ||
      baseTheme.header.filter.padding};
    }

    .${pfx}-header-resizing {
      background: ${tabular?.header?.resizing?.background ||
      palette.background.contrastSecondary};
      color: ${tabular?.header?.resizing?.color ||
      baseTheme.header.resizing.color};
      border-right: ${tabular?.header?.resizing?.border ||
      `1px dashed ${palette.border}`};
    }

    .${pfx}-header-label-sorter {
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 250ms ease;
      color: ${tabular?.header?.sorter?.color || baseTheme.header.sorter.color};
      opacity: ${tabular?.header?.sorter?.opacity ||
      baseTheme.header.sorter.opacity};
    }

    .${pfx}-cell {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0 8px;
      overflow: hidden;
      position: relative;
      transition: border 250ms ease-in;
      border-right: ${variant === "bordered"
        ? tabular?.row?.border || `solid 1px ${palette.border}`
        : "none"};
    }

    .${pfx}-cell-content {
      width: 100%;
    }

    .${pfx}-cell-overflow-ellipsis {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .${pfx}-cell-overflow-truncate {
      max-width: 100%;
      overflow: hidden;
    }

    .${pfx}-cell-one-line {
      word-break: keep-all;
      white-space: nowrap;
    }

    .${pfx}-cell-resizing {
      background: ${tabular?.row?.resizing?.background ||
      palette.background.contrastSecondary};
      color: ${tabular?.row?.resizing?.background ||
      baseTheme.row.resizing.color};
      border-right: ${tabular?.row?.resizing?.border ||
      `1px dashed ${palette.border}`};
    }

    .${pfx}-header-label-align-left, .${pfx}-cell-align-left {
      flex-direction: row;
      justify-content: flex-start;
      text-align: left;
    }

    .${pfx}-header-label-align-right, .${pfx}-cell-align-right {
      flex-direction: row-reverse;
      justify-content: flex-start;
      text-align: right;
    }

    .${pfx}-header-label-sortable {
      cursor: pointer;
      justify-content: space-between;

      :hover {
        > div:first-child {
          max-width: calc(100% - 16px);
          overflow: hidden;
        }

        .${pfx}-header-label-sorter {
          color: ${tabular?.header?.sorter?.hover?.color ||
          baseTheme.header.sorter.hover.color};
          opacity: ${tabular?.header?.sorter?.hover?.opacity ||
          baseTheme.header.sorter.hover.opacity} !important;
        }
      }
    }

    .${pfx}-header-label-sort-desc, .${pfx}-header-label-sort-asc {
      > div:first-child {
        max-width: calc(100% - 16px);
        overflow: hidden;
      }
    }

    .${pfx}-header-overflow-ellipsis {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .${pfx}-header-overflow-truncate {
      max-width: 100%;
      overflow: hidden;
    }

    .${pfx}-col-resizer, .${pfx}-cell-resizer {
      position: absolute;
      top: 0;
      right: 0;
      width: 8px;
      height: 100%;
      z-index: 1;
    }

    .${pfx}-body {
      width: fit-content;
      min-width: 100%;
      flex-grow: 1;
      display: flex;
      flex-direction: column;

      border-top: ${variant === "bordered"
        ? tabular?.row?.border || `solid 1px ${palette.border}`
        : "none"};
      border-right: ${variant === "bordered"
        ? tabular?.row?.border || `solid 1px ${palette.border}`
        : "none"};
      border-left: ${variant === "bordered"
        ? tabular?.row?.border || `solid 1px ${palette.border}`
        : "none"};
    }
  `;
};

export default defaultStyles;
