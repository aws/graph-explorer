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
    }
  `;

export default defaultStyles;
