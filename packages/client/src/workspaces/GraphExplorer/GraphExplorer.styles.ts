import { css } from "@emotion/css";
import { ActiveThemeType, ProcessedTheme } from "../../core";

const defaultStyles = (pfx: string) => ({
  theme,
}: ActiveThemeType<ProcessedTheme>) =>
  css`
    &.${pfx}-graph-explorer {
      .${pfx}-top-bar-title {
        font-weight: bold;
      }
      .${pfx}-top-bar-subtitle {
        font-size: ${theme.typography.sizes?.xs};
      }
      .${pfx}-v-divider {
        height: 24px;
        width: 1px;
        margin: 0 ${theme.spacing["2x"]};
        background: ${theme.palette.divider};
      }
      .${pfx}-button {
        white-space: nowrap;
      }
      .${pfx}-space {
        min-width: 4px;
      }

      .${pfx}-table-view-area {
        position: relative;
        width: 100% !important;
        user-select: none;
      }

      .${pfx}-resizable-handle {
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
