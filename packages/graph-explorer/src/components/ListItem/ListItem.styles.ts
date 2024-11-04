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

  .start-adornment,
  .end-adornment {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 0 ${theme.spacing["2x"]};
    min-width: 32px;
  }

  .content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 48px;
    color: ${theme.palette.text.primary};
  }

  .primary {
    font-weight: normal;
    color: ${theme.palette.text.primary};
  }

  .secondary {
    font-size: 0.8rem;
    color: ${theme.palette.text.secondary};
  }
`;

export default defaultStyles;
