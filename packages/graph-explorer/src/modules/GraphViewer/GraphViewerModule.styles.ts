import { css } from "@emotion/css";
import { ThemeStyleFn } from "@/core";
import fade from "@/core/ThemeProvider/utils/fade";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  &.graph-viewer-module {
    position: relative;
    width: 100%;
    height: 100%;
    flex-grow: 1;

    .no-header {
      top: 4px;
    }

    .entity-select {
      flex-grow: 1;
      min-width: 200px;
      width: 100px;
      margin-bottom: 0;
      margin-left: ${theme.spacing["4x"]};
    }

    > .card-root {
      position: relative;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: ${theme.palette.background.secondary};
      border: solid 1px ${theme.palette.border};
    }

    .loading-container {
      position: absolute;
      display: flex;
      align-items: center;
      bottom: var(--spacing-3x);
      right: var(--spacing-3x);

      > :first-child {
        font-size: ${theme.typography.sizes?.xs};
        color: ${theme.palette.background.contrastSecondary};
      }
    }

    .expanding-overlay {
      display: none;
      color: ${theme.palette.text.primary};
      background-color: ${fade(theme.palette.primary.main, 0.3)};

      justify-content: flex-start;
      align-items: flex-end;
      padding: ${theme.spacing["4x"]};
      font-weight: ${theme.typography.weight?.bold};

      > div {
        display: flex;
        align-items: center;
        color: ${theme.palette.primary.contrastText};
      }

      &.visible {
        display: flex;
      }
    }
  }
`;

export default defaultStyles;
