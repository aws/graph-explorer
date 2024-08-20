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

    .drop-overlay {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      z-index: ${theme.zIndex.panes};
      pointer-events: none;
      transition: background-color 250ms ease;
      border-radius: ${theme.shape.borderRadius};
    }

    .drop-overlay-is-over {
      background-color: ${fade(theme.palette.primary.main, 0.3)};
    }

    .drop-overlay-can-drop {
      background-color: ${fade(theme.palette.secondary.main, 0.3)};
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

    .legend-container {
      position: absolute;
      overflow: auto;
      height: calc(100% - ${theme.spacing["2x"]} - ${theme.spacing["2x"]});
      min-width: 200px;
      max-width: 400px;
      z-index: ${theme.zIndex.panes};
      bottom: ${theme.spacing["2x"]};
      right: ${theme.spacing["2x"]};
      row-gap: ${theme.spacing["2x"]};

      .legend-title {
        .content {
          .primary {
            font-weight: bold;
          }
        }
        .end-adornment {
          margin: 0;
        }
      }
      .legend-item {
        .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: ${theme.spacing.base};
          border-radius: 12px;
          color: ${theme.palette.primary.main};
          background: ${fade(theme.palette.primary.main, 0.3)};
        }
        .content {
          min-height: 24px;
        }
      }
    }
  }
`;

export default defaultStyles;
