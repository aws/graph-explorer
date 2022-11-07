import { css } from "@emotion/css";
import { cssVar } from "../../core/ThemeProvider/utils/lib";

const defaultStyles = () => css`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-top: var(--spacing-2x, 8px);
  background-color: rgba(
    ${cssVar("--palette-background-default-rgb", "#FFF")},
    0.5
  );
  color: ${cssVar("--palette-text-primary", "#000")} > p {
    margin: 0;
  }
`;

export default defaultStyles;
