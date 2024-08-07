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
`;

export default defaultStyles;
