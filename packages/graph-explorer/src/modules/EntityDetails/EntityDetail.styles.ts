import { css } from "@emotion/css";
import type { ThemeStyleFn } from "@/core";
import fade from "@/core/ThemeProvider/utils/fade";

const defaultStyles =
  (lineColor = "#b3b3b3"): ThemeStyleFn =>
  ({ theme }) => css`
    .header {
      position: sticky;
      top: 0;
      z-index: 1;
      background: ${theme.palette.background.default};
      display: flex;
      padding: ${theme.spacing["4x"]} ${theme.spacing["3x"]};
      align-items: center;
      column-gap: ${theme.spacing["2x"]};
      border-bottom: solid 1px ${theme.palette.border};

      .icon {
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

      .content {
        word-break: break-word;
        .title {
          font-weight: bold;
        }
      }
    }

    .source-vertex {
      position: relative;
      z-index: 0;
      padding-left: calc(${theme.spacing["3x"]} + 48px);

      .start-line {
        position: absolute;
        left: calc(${theme.spacing["3x"]} + 16px);
        top: 20%;
        height: 80%;
        width: 2px;

        .source-arrow-type {
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

    .target-vertex {
      position: relative;
      z-index: 0;
      padding-left: calc(${theme.spacing["3x"]} + 48px);

      .end-line {
        position: absolute;
        left: calc(${theme.spacing["3x"]} + 16px);
        top: -1px;
        height: 80%;
        width: 2px;

        .target-arrow-type {
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

    .line-solid {
      background: ${lineColor};
    }

    .line-dashed {
      background-image: linear-gradient(
        ${lineColor} 70%,
        rgba(255, 255, 255, 0) 0%
      );
      background-position: right;
      background-size: 2px 10px;
      background-repeat: repeat-y;
    }

    .line-dotted {
      background-image: linear-gradient(
        ${lineColor} 50%,
        rgba(255, 255, 255, 0) 0%
      );
      background-position: right;
      background-size: 2px 6px;
      background-repeat: repeat-y;
    }

    .connections {
      padding: ${theme.spacing["4x"]} ${theme.spacing["3x"]};
      border-bottom: solid 1px ${theme.palette.border};

      .title {
        font-weight: bold;
      }

      .chip {
        padding: ${theme.spacing["2x"]};
        background: ${fade(theme.palette.primary.main, 0.2)};
        color: ${theme.palette.primary.main};
      }

      .content {
        display: flex;
        margin-top: ${theme.spacing["2x"]};
        column-gap: ${theme.spacing["4x"]};
        .item {
          .chip {
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
  `;

export default defaultStyles;
