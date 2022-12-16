import { css } from "@emotion/css";

const defaultStyles = (pfx: string) => css`
  &.${pfx}-trigger {
    display: inline-block;
    width: 100%;
  }

  &.${pfx}-overlay {
    display: block;
  }
`;

export default defaultStyles;
