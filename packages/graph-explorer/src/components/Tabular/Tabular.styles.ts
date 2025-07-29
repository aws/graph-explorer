import { css } from "@emotion/css";

import { fade, ThemeStyleFn } from "@/core";
import baseTheme from "./baseTheme";

const defaultStyles =
  (variant: "bordered" | "noBorders" = "bordered"): ThemeStyleFn =>
  ({ theme }) => {
    const { palette } = theme;

    return css`
      max-width: 100%;
      overflow: auto;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: 100%;
      height: 100%;
      background: ${palette.background.default};
      color: ${palette.text.primary};

      .table {
        flex-grow: 1;
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .headers {
        box-sizing: border-box;
        width: fit-content;
        min-width: 100%;
        background: ${palette.background.contrast};
        color: ${palette.text.secondary};
        border: solid 1px ${palette.border};
        ${variant === "noBorders" && `border-right: none; border-left: none;`}
        min-height: ${baseTheme.header.minHeight};

        .row:last-child {
          border-bottom: none;
        }
      }

      .headers-sticky {
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .row {
        box-sizing: border-box;
        min-height: ${baseTheme.row.minHeight};
        border-bottom: ${variant === "bordered"
          ? `solid 1px ${palette.border}`
          : "none"};
        flex-grow: 0 !important;
        transition: background-color 250ms ease;

        :first-child {
          border-top: solid 1px ${palette.border};
        }

        :hover {
          background: ${palette.background.contrast};
          color: ${palette.text.primary};
        }

        :first-child {
          border-top: none;
        }
      }

      .row-grow {
        flex-grow: 1 !important;
      }

      .row-selectable {
        background: ${baseTheme.row.selectable.background};
        color: ${baseTheme.row.selectable.color};
        :hover {
          background: ${baseTheme.row.selectable.hover.background};
          color: ${palette.primary.dark};
          cursor: pointer;
        }
      }

      .row-selected {
        background: ${fade(palette.primary.main, 0.25)};
        color: ${baseTheme.row.selected.color};
      }

      .header {
        display: flex;
        flex-direction: column;
        padding: ${baseTheme.header.padding};
        border-right: ${variant === "bordered"
          ? `1px solid ${palette.border}`
          : "none"};
        background: ${palette.background.contrast};
        color: ${baseTheme.header.color};
        transition:
          background 250ms ease-in,
          border 250ms ease-in;
      }

      .header-label {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        flex-grow: 1;
        width: 100%;
        font-weight: ${baseTheme.header.label.fontWeight};
        min-height: ${baseTheme.header.label.minHeight};
        margin: ${baseTheme.header.label.margin};
        padding: ${baseTheme.header.label.padding};
      }

      .header-filter {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        flex-grow: 1;
        width: 100%;
        min-height: ${baseTheme.header.filter.minHeight};
        margin: ${baseTheme.header.filter.margin};
        padding: ${baseTheme.header.filter.padding};
      }

      .header-resizing {
        background: ${palette.background.contrastSecondary};
        color: ${baseTheme.header.resizing.color};
        border-right: 1px dashed ${palette.border};
      }

      .header-label-sorter {
        display: flex;
        justify-content: center;
        align-items: center;
        transition: transform 250ms ease;
        color: ${baseTheme.header.sorter.color};
        opacity: ${baseTheme.header.sorter.opacity};
      }

      .cell {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 8px;
        overflow: hidden;
        position: relative;
        transition: border 250ms ease-in;
        border-right: ${variant === "bordered"
          ? `solid 1px ${palette.border}`
          : "none"};
      }

      .cell-content {
        width: 100%;
      }

      .cell-overflow-ellipsis {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cell-overflow-truncate {
        max-width: 100%;
        overflow: hidden;
      }

      .cell-one-line {
        word-break: keep-all;
        white-space: nowrap;
      }

      .cell-resizing {
        background: ${palette.background.contrastSecondary};
        color: ${baseTheme.row.resizing.color};
        border-right: 1px dashed ${palette.border};
      }

      .header-label-align-left,
      .cell-align-left {
        flex-direction: row;
        justify-content: flex-start;
        text-align: left;
      }

      .header-label-align-right,
      .cell-align-right {
        flex-direction: row-reverse;
        justify-content: flex-start;
        text-align: right;
      }

      .header-label-sortable {
        cursor: pointer;
        justify-content: space-between;

        :hover {
          > div:first-child {
            max-width: calc(100% - 16px);
            overflow: hidden;
          }

          .header-label-sorter {
            color: ${baseTheme.header.sorter.hover.color};
            opacity: ${baseTheme.header.sorter.hover.opacity} !important;
          }
        }
      }

      .header-label-sort-desc,
      .header-label-sort-asc {
        > div:first-child {
          max-width: calc(100% - 16px);
          overflow: hidden;
        }
      }

      .header-overflow-ellipsis {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .header-overflow-truncate {
        max-width: 100%;
        overflow: hidden;
      }

      .col-resizer,
      .cell-resizer {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        z-index: 1;
      }

      .body {
        width: fit-content;
        min-width: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;

        border-top: ${variant === "bordered"
          ? `solid 1px ${palette.border}`
          : "none"};
        border-right: ${variant === "bordered"
          ? `solid 1px ${palette.border}`
          : "none"};
        border-left: ${variant === "bordered"
          ? `solid 1px ${palette.border}`
          : "none"};
      }
    `;
  };

export default defaultStyles;
