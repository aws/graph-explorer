import { css } from "@emotion/css";
import { ActiveThemeType } from "@/core";

const defaultStyles = ({ theme }: ActiveThemeType) => css`
  .top-bar-title {
    font-weight: bold;
  }

  .input-url {
    margin-top: ${theme.spacing["4x"]};
  }

  .configuration-form {
    width: 100%;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    padding-top: ${theme.spacing["4x"]};
    border-top: solid 1px ${theme.palette.divider};
  }
`;

export default defaultStyles;
