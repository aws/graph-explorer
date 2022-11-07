import { cx } from "@emotion/css";

import { forwardRef, PropsWithChildren } from "react";

import defaultStyles from "./Footer.styles";

export interface FooterProps {
  className?: string;
}

const Footer = forwardRef<HTMLDivElement, PropsWithChildren<FooterProps>>(
  ({ className, children }, ref) => {
    return (
      <div ref={ref} className={cx(defaultStyles(), className)}>
        {children}
      </div>
    );
  }
);

export default Footer;
