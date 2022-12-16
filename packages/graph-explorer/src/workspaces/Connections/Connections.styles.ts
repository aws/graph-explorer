import { css } from "@emotion/css";
import { ActiveThemeType, ProcessedTheme } from "../../core";

const defaultStyles = (pfx: string) => ({
  theme,
}: ActiveThemeType<ProcessedTheme>) =>
  css`
    &.${pfx}-connections {
      .${pfx}-button {
        white-space: nowrap;
      }

      .${pfx}-top-bar-title {
        font-weight: bold;
      }
      .${pfx}-top-bar-subtitle {
        font-size: ${theme.typography.sizes?.xs};
      }

      .${pfx}-advanced-list {
        padding: ${theme.spacing["2x"]};
        background: ${theme.palette.background.default};
        .${pfx}-content {
          background: ${theme.palette.background.default};
          height: 100%;
          .${pfx}-advanced-list-nogroup {
            height: 100%;
            .${pfx}-advanced-list-item-subtitle {
              display: flex;
              gap: ${theme.spacing["4x"]};
            }
            .${pfx}-advanced-list-item {
              background: ${theme.palette.background.secondary};
              .${pfx}-content {
                background: ${theme.palette.background.secondary};
              }
            }
          }
        }
      }
    }
  `;

export default defaultStyles;
