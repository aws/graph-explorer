import { css } from "@emotion/css";
import type { ProcessedTheme, ThemeStyleFn } from "@/core";

type DefaultStylesProps = {
  elevation: 0 | 1 | 2 | 3 | 4;
  disablePadding?: boolean;
  isDarkTheme?: boolean;
  transparent?: boolean;
};

const getStylesByElevation = (
  elevation: 0 | 1 | 2 | 3 | 4,
  theme: ProcessedTheme,
  isDarkTheme?: boolean
) => css`
  box-shadow: ${!isDarkTheme ? shadowMap(theme)[elevation] : "none"};
  &.card-elevation-0 {
    background-color: ${theme.palette.background.default};
  }

  &.card-elevation-1 {
    background-color: ${isDarkTheme
      ? theme.palette.background.secondary
      : theme.palette.background.default};
  }

  &.card-elevation-2 {
    background-color: ${isDarkTheme
      ? theme.palette.background.contrast
      : theme.palette.background.default};
  }

  //elevation 3 and 4 is the same as elevation 2 because the grey-500 and grey-400 are way too light for the text to stand out
  &.card-elevation-3 {
    background-color: ${isDarkTheme
      ? theme.palette.background.contrastSecondary
      : theme.palette.background.default};
  }

  &.card-elevation-4 {
    background-color: ${isDarkTheme
      ? theme.palette.grey["600"]
      : theme.palette.background.default};
  }
`;

const shadowMap = (
  theme: ProcessedTheme
): Record<0 | 1 | 2 | 3 | 4, string> => ({
  0: theme.shadow.none,
  1: theme.shadow.base,
  2: theme.shadow.md,
  3: theme.shadow.lg,
  4: theme.shadow.xl,
});

const defaultStyles =
  ({
    elevation,
    disablePadding,
    transparent,
  }: DefaultStylesProps): ThemeStyleFn =>
  ({ theme, isDarkTheme }) => css`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    position: relative;
    color: ${theme.palette.text.primary};
    border-radius: ${theme.shape.borderRadius};
    padding: ${disablePadding ? 0 : theme.spacing["2x"]};
    background-color: ${theme.palette.background.default};
    box-shadow: ${!isDarkTheme ? shadowMap(theme)[elevation] : "none"};
    border: 1px solid ${isDarkTheme ? theme.palette.border : "transparent"};
    ${!transparent && getStylesByElevation(elevation, theme, isDarkTheme)}
    &.card-clickable {
      cursor: pointer;
      &:hover {
        border-color: ${theme.palette.primary.main};
      }
    }
  `;

export default defaultStyles;
