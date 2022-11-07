import { css } from "@emotion/css";
import {
  ActiveThemeType,
  ProcessedTheme,
} from "../../core/ThemeProvider/types";

const defaultStyles = (pfx: string) => ({
  theme,
  isDarkTheme,
}: ActiveThemeType<ProcessedTheme>) =>
  css`
    &.${pfx}-entities-filters {
      width: 100%;
      margin: 0;
      padding: 0;
      border: solid 1px ${isDarkTheme ? theme.palette.divider : "transparent"};
      border-radius: ${theme.shape.borderRadius};
      background: ${isDarkTheme
        ? theme.palette.background.secondary
        : theme.palette.background.default};
    }

    .${pfx}-section-divider {
      height: 1px;
      min-height: 1px;
      width: 100%;
      margin: ${theme.spacing.base} auto;
      background-color: ${theme.palette.divider};
    }

    .${pfx}-checkbox-list-container {
      width: 90%;
      margin: 0 auto;
      min-height: auto;
      max-height: 50%;
    }
  `;

export default defaultStyles;
