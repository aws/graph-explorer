import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import fade from "../../core/ThemeProvider/utils/fade";

const defaultStyles = (pfx: string, lineColor = "#b3b3b3"): ThemeStyleFn => ({
  theme,
}) =>
  css`
    height: 100%;
    overflow: auto;
    background: ${theme.palette.background.default};

    .${pfx}-header {
      position: sticky;
      top: 0;
      z-index: 1;
      background: ${theme.palette.background.default};
      display: flex;
      padding: ${theme.spacing["4x"]};
      align-items: center;
      column-gap: ${theme.spacing["2x"]};
      border-bottom: solid 1px ${theme.palette.border};

      .${pfx}-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        background: ${fade(theme.palette.primary.main, 0.2)};
        color: ${theme.palette.primary.main};
        font-size: 2em;
        border-radius: 24px;
        min-width: 36px;
        min-height: 36px;
      }

      .${pfx}-content {
        word-break: break-word;
        .${pfx}-title {
          font-weight: bold;
        }
      }
    }

    .${pfx}-source-vertex {
      position: relative;
      z-index: 0;
      padding-left: calc(${theme.spacing["4x"]} + 48px);

      .${pfx}-start-line {
        position: absolute;
        left: calc(${theme.spacing["4x"]} + 16px);
        top: 20%;
        height: 80%;
        width: 2px;

        .${pfx}-source-arrow-type {
          position: absolute;
          top: -12px;
          left: -11px;
          transform: rotate(-90deg);
          width: 24px;
          height: 24px;
          color: ${lineColor};
        }
      }
    }

    .${pfx}-target-vertex {
      position: relative;
      z-index: 0;
      padding-left: calc(${theme.spacing["4x"]} + 48px);

      .${pfx}-end-line {
        position: absolute;
        left: calc(${theme.spacing["4x"]} + 16px);
        top: -1px;
        height: 80%;
        width: 2px;

        .${pfx}-target-arrow-type {
          position: absolute;
          bottom: -12px;
          left: -11px;
          transform: rotate(90deg);
          width: 24px;
          height: 24px;
          color: ${lineColor};
        }
      }
    }

    .${pfx}-line-solid {
      background: ${lineColor};
    }

    .${pfx}-line-dashed {
      background-image: linear-gradient(
        ${lineColor} 70%,
        rgba(255, 255, 255, 0) 0%
      );
      background-position: right;
      background-size: 2px 10px;
      background-repeat: repeat-y;
    }

    .${pfx}-line-dotted {
      background-image: linear-gradient(
        ${lineColor} 50%,
        rgba(255, 255, 255, 0) 0%
      );
      background-position: right;
      background-size: 2px 6px;
      background-repeat: repeat-y;
    }

    .${pfx}-connections {
      padding: ${theme.spacing["4x"]};
      border-bottom: solid 1px ${theme.palette.border};

      .${pfx}-title {
        font-weight: bold;
      }

      .${pfx}-chip {
        padding: ${theme.spacing["2x"]};
        background: ${fade(theme.palette.primary.main, 0.2)};
        color: ${theme.palette.primary.main};
      }

      .${pfx}-content {
        display: flex;
        margin-top: ${theme.spacing["2x"]};
        column-gap: ${theme.spacing["4x"]};
        .${pfx}-item {
          .${pfx}-chip {
            padding: ${theme.spacing["2x"]};
            background: ${fade(theme.palette.primary.main, 0.2)};
            color: ${theme.palette.primary.main};
          }
          span {
            font-weight: bold;
          }
        }
      }
    }

    .${pfx}-properties {
      padding: ${theme.spacing["4x"]};

      .${pfx}-title {
        font-weight: bold;
      }

      .${pfx}-content {
        display: flex;
        flex-direction: column;
        margin-top: ${theme.spacing["2x"]};

        .${pfx}-attribute {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: ${theme.spacing["2x"]} 0;

          .${pfx}-attribute-select {
            margin-bottom: 0;
            width: auto;
            min-width: 120px;
            .${pfx}-select {
              padding: ${theme.spacing.base} 0 ${theme.spacing.base}
                ${theme.spacing["2x"]};
              border-radius: 24px;
            }
            .${pfx}-option-selected {
              background: ${theme.palette.primary.main};
              color: ${theme.palette.primary.contrastText};
            }
            .${pfx}-selection, .${pfx}-placeholder {
              margin-right: 24px;
            }
          }

          > div {
            width: 100%;
            .${pfx}-attribute-name {
              display: flex;
              align-items: center;
              justify-content: space-between;
              column-gap: ${theme.spacing.base};
              font-size: ${theme.typography.sizes?.xs};

              > * {
                word-break: break-word;
              }
            }
            .${pfx}-attribute-value {
              word-break: break-word;
              font-weight: bold;
            }
          }
        }
      }
    }
  `;

export default defaultStyles;
