import { css } from "@emotion/css";
import {
  ActiveThemeType,
  ProcessedTheme,
} from "../../core/ThemeProvider/types";

const defaultStyles = ({
  theme,
  isDarkTheme,
}: ActiveThemeType<ProcessedTheme>) => css`
  &.entities-filters {
    width: 100%;
    margin: 0;
    padding: 0;
    border: solid 1px ${isDarkTheme ? theme.palette.divider : "transparent"};
    border-radius: ${theme.shape.borderRadius};
    background: ${isDarkTheme
      ? theme.palette.background.secondary
      : theme.palette.background.default};
  }

  .section-divider {
    height: 1px;
    min-height: 1px;
    width: 100%;
    margin: ${theme.spacing.base} auto;
    background-color: ${theme.palette.divider};
  }

  .checkbox-list-container {
    width: 90%;
    margin: 0 auto;
    min-height: auto;
    max-height: 50%;
  }
`;

export default defaultStyles;
