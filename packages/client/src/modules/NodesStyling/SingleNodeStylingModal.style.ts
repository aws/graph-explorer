import { css } from "@emotion/css";
import type { ThemeStyleFn } from "../../core";

const defaultStyles = (pfx: string): ThemeStyleFn => ({ theme }) => css`
  div[role="presentation"] > div {
    margin-top: auto;
    margin-left: auto;
    margin-bottom: 0;
  }
  .${pfx}-container {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing["4x"]};

    .${pfx}-attrs-container {
      display: flex;
      justify-content: space-between;
      gap: ${theme.spacing["2x"]};

      > * {
        flex-grow: 1;
        width: 100%;
      }
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

      &:hover {
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

    .${pfx}-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: ${theme.spacing["2x"]};
      border-top: solid 1px ${theme.palette.divider};
    }
  }
`;

export default defaultStyles;
