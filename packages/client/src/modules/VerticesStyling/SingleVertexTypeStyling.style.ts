import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx?: string): ThemeStyleFn => ({ theme }) =>
  css`
    display: flex;
    flex-direction: column;
    background: ${theme.palette.background.default};
    margin-bottom: ${theme.spacing["4x"]};

    .${pfx}-title {
      margin-bottom: ${theme.spacing.base};
      max-width: 80%;

      span {
        display: inline-block;
        width: 100%;
      }
      span::before,
      span::after {
        display: inline-block;
        max-width: 50%;
        overflow: hidden;
      }

      span::before {
        content: attr(data-content-start);
        text-overflow: ellipsis;
      }

      span::after {
        display: inline-block;
        content: attr(data-content-end);
        text-overflow: ellipsis;
        direction: rtl;
      }
    }

    .${pfx}-editable-content {
      display: flex;
      flex-direction: row;

      .${pfx}-input {
        margin: 0px;
        .${pfx}-end-adornment {
          height: 100%;
        }
      }

      .${pfx}-label, .${pfx}-color, .${pfx}-icon {
        padding-right: ${theme.spacing["2x"]};
      }

      .${pfx}-label {
        width: 60%;
      }
      .${pfx}-color {
        width: 30%;
        min-width: 105px;
        margin-right: ${theme.spacing["2x"]};
      }
      .${pfx}-icon {
        width: 10%;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;

        button {
          color: ${theme.palette.common.black};
          box-shadow: none;
          background: none;

          .${pfx}-upload-icon {
            display: none;
          }

          .${pfx}-vertex-icon {
            border-radius: 50%;
            padding: ${theme.spacing.base};
            display: block;
            width: 28px;
            height: 28px;

            > * {
              width: 18px;
              height: 18px;
            }
          }
        }
      }

      .${pfx}-icon:hover {
        cursor: pointer;

        button {
          background: ${theme.palette.grey[200]};
          border-radius: 50%;

          .${pfx}-upload-icon {
            display: block;
          }

          .${pfx}-vertex-icon {
            display: none;
          }
        }
      }
    }
  `;

export default defaultStyles;
