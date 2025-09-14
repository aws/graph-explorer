import { css } from "@emotion/css";

import { type PropsWithChildren } from "react";

const defaultStyles = () => css`
  font-style: italic;
  font-size: 1.3rem;
  opacity: 0.7;
  color: var(--palette-primary-main);
`;

export const PlaceholderControl = ({ children }: PropsWithChildren) => {
  return <div className={defaultStyles()}>{children}</div>;
};

export default PlaceholderControl;
