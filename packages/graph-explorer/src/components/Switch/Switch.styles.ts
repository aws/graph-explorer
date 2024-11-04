import { css } from "@emotion/css";

import { fade, ThemeStyleFn } from "@/core";

export const defaultSwitchStyles =
  (width: number): ThemeStyleFn =>
  ({ theme }) => {
    const { palette } = theme;
    const trackWidth = width - 10;

    return css`
      margin-right: 4px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 4px 5px;
      &.switch-on {
        .switch-track {
          background: ${palette.primary.main};
          justify-content: flex-end;
          .switch-handle {
            transform: translateX(calc(${trackWidth - 2}px - 100% - 2px));
            color: ${palette.primary.main};
            background-color: ${palette.common.white};
          }
        }
      }

      &.switch-off {
        .switch-track {
          justify-content: flex-start;
          background-color: ${palette.grey["500"]};
          .switch-handle {
            color: ${palette.grey["500"]};
            background-color: ${palette.common.white};
          }
        }
      }
      &.switch-focused {
        .switch-track {
          outline: 2px solid ${fade(palette.primary.main, 0.5)};
        }
      }

      &.switch-sm {
        .switch-track {
          .switch-handle {
            width: 36%;
            svg {
              font-size: 9px;
            }
          }
        }
      }

      &.switch-lg {
        .switch-track {
          .switch-handle {
            width: 50%;
            svg {
              font-size: 15px;
            }
          }
        }
      }
      .switch-track {
        cursor: pointer;
        height: 100%;
        width: 100%;
        padding: 2px 0;
        border-radius: 10px;
        position: relative;
        display: flex;
        align-items: center;
        .switch-handle {
          width: 46%;
          left: 0;
          height: calc(100% - 4px);
          position: absolute;
          border-radius: 50%;
          margin-left: 2px;
          margin-right: 2px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all ease 300ms;

          > svg {
            font-size: 12px;
          }
        }
      }

      &.switch-disabled {
        filter: opacity(${theme.forms?.disabledOpacity || "50%"});
        > .focus {
          color: ${palette.primary.main};
        }
      }
    `;
  };

export const defaultSwitchLabelStyles: ThemeStyleFn = ({ theme }) => {
  const {
    palette: { text },
    forms,
  } = theme;

  return css`
    display: flex;
    align-items: center;
    cursor: pointer;
    color: ${text.primary};
    font-size: ${theme.typography.sizes?.sm};

    &.switch-label-disabled {
      cursor: auto;
      pointer-events: none;
      filter: opacity(${forms?.disabledOpacity || "50%"});
    }

    &.switch-label-readonly {
      cursor: auto;
      pointer-events: none;
    }
  `;
};
