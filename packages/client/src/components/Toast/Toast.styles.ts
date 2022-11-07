import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => css`
  position: relative;
  width: fit-content;

  .${pfx}-info {
    background: ${theme.palette.primary.main};
    color: ${theme.palette.primary.contrastText};
    .${pfx}-icon {
      background: ${theme.palette.primary.main};
      color: ${theme.palette.primary.contrastText};
    }
  }

  .${pfx}-error {
    background: ${theme.palette.error.main};
    color: ${theme.palette.error.contrastText};
    .${pfx}-icon {
      background: ${theme.palette.error.main};
      color: ${theme.palette.error.contrastText};
    }
  }

  .${pfx}-warning {
    background: ${theme.palette.warning.main};
    color: ${theme.palette.warning.contrastText};
    .${pfx}-icon {
      background: ${theme.palette.warning.main};
      color: ${theme.palette.warning.contrastText};
    }
  }

  .${pfx}-success {
    background: ${theme.palette.success.main};
    color: ${theme.palette.success.contrastText};
    .${pfx}-icon {
      background: ${theme.palette.success.main};
      color: ${theme.palette.success.contrastText};
    }
  }

  .${pfx}-card {
    flex-grow: 1;
    display: flex;
    padding: 0;
    overflow: hidden;
    flex-direction: row;
  }

  .${pfx}-content {
    margin: ${theme.spacing["2x"]};
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 32px;
  }

  .${pfx}-title {
    font-weight: bold;
    margin-bottom: ${theme.spacing["2x"]};
  }

  .${pfx}-icon {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
  }

  .${pfx}-close-container {
    padding: 4px;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 32px;

    > div {
      cursor: pointer;
    }
  }

  .${pfx}-close-container-no-title {
    align-items: center;
  }
`;

export default defaultStyles;
