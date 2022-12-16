import { css } from "@emotion/css";
import type { ProcessedTheme, ThemeStyleFn } from "../../core";

type DefaultStylesProps = {
  elevation: 0 | 1 | 2 | 3 | 4;
  classNamePrefix: string;
  disablePadding?: boolean;
  isDarkTheme?: boolean;
  transparent?: boolean;
};

const getStylesByElevation = (
  classNamePrefix: string,
  elevation: 0 | 1 | 2 | 3 | 4,
  theme: ProcessedTheme,
  isDarkTheme?: boolean
) => css`
  box-shadow: ${!isDarkTheme ? shadowMap(theme)[elevation] : "none"};
  &.${classNamePrefix}-card-elevation-0 {
    background-color: ${theme.card?.background?.elevation?.["0"] ||
    theme.card?.background?.base ||
    theme.palette.background.default};
  }

  &.${classNamePrefix}-card-elevation-1 {
    background-color: ${theme.card?.background?.elevation?.["1"] ||
    theme.card?.background?.base ||
    isDarkTheme
      ? theme.palette.background.secondary
      : theme.palette.background.default};
  }

  &.${classNamePrefix}-card-elevation-2 {
    background-color: ${theme.card?.background?.elevation?.["2"] ||
    theme.card?.background?.base ||
    isDarkTheme
      ? theme.palette.background.contrast
      : theme.palette.background.default};
  }

  //elevation 3 and 4 is the same as elevation 2 because the grey-500 and grey-400 are way too light for the text to stand out
  &.${classNamePrefix}-card-elevation-3 {
    background-color: ${theme.card?.background?.elevation?.["3"] ||
    theme.card?.background?.base ||
    isDarkTheme
      ? theme.palette.background.contrastSecondary
      : theme.palette.background.default};
  }

  &.${classNamePrefix}-card-elevation-4 {
    background-color: ${theme.card?.background?.elevation?.["4"] ||
    theme.card?.background?.base ||
    isDarkTheme
      ? theme.palette.grey["600"]
      : theme.palette.background.default};
  }
`;

const shadowMap = (
  theme: ProcessedTheme
): Record<0 | 1 | 2 | 3 | 4, string> => ({
  0: theme.card?.shadow?.elevation?.["0"] || theme.shadow.none,
  1: theme.card?.shadow?.elevation?.["1"] || theme.shadow.base,
  2: theme.card?.shadow?.elevation?.["2"] || theme.shadow.md,
  3: theme.card?.shadow?.elevation?.["3"] || theme.shadow.lg,
  4: theme.card?.shadow?.elevation?.["3"] || theme.shadow.xl,
});

const defaultStyles = ({
  elevation,
  classNamePrefix,
  disablePadding,
  transparent,
}: DefaultStylesProps): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    position: relative;
    color: ${theme.card?.color || theme.palette.text.primary};
    border-radius: ${theme.card?.borderRadius || theme.shape.borderRadius};
    padding: ${disablePadding ? 0 : theme.spacing["2x"]};
    background-color: ${theme.card?.background?.base ||
    theme.palette.background.default};
    box-shadow: ${!isDarkTheme ? shadowMap(theme)[elevation] : "none"};
    border: 1px solid ${isDarkTheme ? theme.palette.border : "transparent"};
    ${!transparent &&
    getStylesByElevation(classNamePrefix, elevation, theme, isDarkTheme)}
    &.${classNamePrefix}-card-clickable {
      cursor: pointer;
      &:hover {
        border-color: ${theme.palette.primary.main};
      }
    }
  `;

export default defaultStyles;
