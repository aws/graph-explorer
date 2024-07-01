import { css } from "@emotion/css";
import { ActiveThemeType, ProcessedTheme } from "../../core";

const defaultStyles = ({ theme }: ActiveThemeType<ProcessedTheme>) => css`
  &.graph-explorer {
    .v-divider {
      height: 24px;
      width: 1px;
      margin: 0 ${theme.spacing["2x"]};
      background: ${theme.palette.divider};
    }
    .button {
      white-space: nowrap;
    }
    .space {
      min-width: 4px;
    }

    .table-view-area {
      position: relative;
      width: 100% !important;
      user-select: none;
    }

    .resizable-handle {
      cursor: ns-resize;
      width: 100%;
      height: 4px;
      position: absolute;
      top: -6px;
      z-index: 100000;
      left: 0;
      border-radius: ${theme.shape.borderRadius};
      :hover {
        background: ${theme.palette.grey["400"]};
      }
    }
  }
`;

export default defaultStyles;
