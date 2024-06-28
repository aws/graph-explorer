import { css } from "@emotion/css";
import { ActiveThemeType, ProcessedTheme } from "../../core";

const defaultStyles = ({ theme }: ActiveThemeType<ProcessedTheme>) => css`
  &.connections {
    .button {
      white-space: nowrap;
    }

    .advanced-list {
      padding: ${theme.spacing["2x"]};
      background: ${theme.palette.background.default};
      .content {
        background: ${theme.palette.background.default};
        height: 100%;
        .advanced-list-nogroup {
          height: 100%;
          .advanced-list-item-subtitle {
            display: flex;
            gap: ${theme.spacing["4x"]};
          }
          .advanced-list-item {
            background: ${theme.palette.background.secondary};
            .content {
              background: ${theme.palette.background.secondary};
            }
          }
        }
      }
    }
  }
`;

export default defaultStyles;
