import { css } from "@emotion/css";

import type { ThemeStyleFn } from "../../core";
import { lighten } from "../../core";

const defaultStyles = (pfx: string) => css`
  display: flex;
  align-items: center;
  background: transparent;

  .${pfx}-adornment {
    display: flex;
    align-items: center;
    height: 100%;
  }
`;

const calendarStyles = (): ThemeStyleFn => ({ theme, isDarkTheme }) =>
  css`
  background-color: ${
    isDarkTheme
      ? theme.palette.background.secondary
      : theme.palette.background.default
  };
  border-radius: ${theme.shape.borderRadius};
  padding: ${theme.spacing.base};
  box-shadow: ${theme.shadow.md};
  border: 1px solid ${isDarkTheme ? theme.palette.border : "transparent"};
  }
`;

const inRange = (): ThemeStyleFn => ({ theme }) =>
  css`
    color: ${theme.palette.common.black};
    background-color: ${lighten(theme.palette.primary.main, 0.8)};
    "&:not(:disabled)": {
      background-color: ${lighten(theme.palette.primary.main, 0.5)};
    }
  `;

const styles = {
  defaultStyles,
  calendarStyles,
  inRange,
};

export default styles;
