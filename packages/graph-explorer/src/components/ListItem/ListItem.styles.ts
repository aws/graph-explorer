import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme, isDarkTheme }) => css`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;

  &.clickable {
    cursor: pointer;
    transition:
      color 250ms ease,
      background 250ms ease;
    background: ${isDarkTheme
      ? theme.palette.background.secondary
      : theme.palette.background.default};
    color: ${theme.palette.text.primary};

    &.disabled {
      color: ${theme.palette.text.disabled};
      pointer-events: none;

      .primary {
        color: ${theme.palette.text.disabled};
        pointer-events: none;
      }
    }

    :hover {
      background: ${theme.palette.background.contrast};
      color: ${theme.palette.text.primary};
    }
  }
`;

export default defaultStyles;
