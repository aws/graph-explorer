import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  position: relative;
  width: fit-content;

  .info {
    background: ${theme.palette.primary.main};
    color: ${theme.palette.primary.contrastText};
    .icon {
      background: ${theme.palette.primary.main};
      color: ${theme.palette.primary.contrastText};
    }
  }

  .error {
    background: ${theme.palette.error.main};
    color: ${theme.palette.error.contrastText};
    .icon {
      background: ${theme.palette.error.main};
      color: ${theme.palette.error.contrastText};
    }
  }

  .warning {
    background: ${theme.palette.warning.main};
    color: ${theme.palette.warning.contrastText};
    .icon {
      background: ${theme.palette.warning.main};
      color: ${theme.palette.warning.contrastText};
    }
  }

  .success {
    background: ${theme.palette.success.main};
    color: ${theme.palette.success.contrastText};
    .icon {
      background: ${theme.palette.success.main};
      color: ${theme.palette.success.contrastText};
    }
  }

  .card {
    flex-grow: 1;
    display: flex;
    padding: 0;
    overflow: hidden;
    flex-direction: row;
  }

  .content {
    margin: ${theme.spacing["2x"]};
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 32px;
  }

  .title {
    font-weight: bold;
    margin-bottom: ${theme.spacing["2x"]};
  }

  .icon {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
  }

  .close-container {
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

  .close-container-no-title {
    align-items: center;
  }
`;

export default defaultStyles;
