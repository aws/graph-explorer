import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";
import fade from "../../core/ThemeProvider/utils/fade";

const defaultStyles = (pfx?: string): ThemeStyleFn => ({ theme }) =>
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
        width: 0;
        border: solid 1px ${theme.palette.primary.main};

        :before {
          position: absolute;
          top: 0;
          left: 0;
          transform: translate(-50%, -50%);
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 8px;
          background: ${theme.palette.primary.main};
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
        width: 0;
        border: solid 1px ${theme.palette.primary.main};

        :before {
          position: absolute;
          bottom: 4px;
          left: 0;
          transform: translate(-50%, 50%) rotate(45deg);
          content: "";
          width: 8px;
          height: 8px;
          border: solid ${theme.palette.primary.main};
          border-width: 0 2px 2px 0;
        }
      }
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

          &:not(:last-of-type) {
            border-bottom: solid 1px ${theme.palette.border};
          }

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
