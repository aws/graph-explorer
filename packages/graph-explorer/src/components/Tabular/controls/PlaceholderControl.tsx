import { css } from "@emotion/css";

import { FC } from "react";

const defaultStyles = () => css`
  font-style: italic;
  font-size: 1.3rem;
  opacity: 0.7;
  color: var(--palette-primary-main);
`;

export const PlaceholderControl: FC = ({ children }) => {
  return <div className={defaultStyles()}>{children}</div>;
};

export default PlaceholderControl;
