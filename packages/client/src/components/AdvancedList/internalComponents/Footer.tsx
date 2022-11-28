import { memo } from "react";
import Section from "../../Section";

type FooterProps = {
  count: number;
  total: number;
  className: string;
  classNamePrefix: string;
};

const Footer = ({ count, total, className, classNamePrefix }: FooterProps) => {
  return (
    <Section
      showWhenEmpty
      title={`Showing ${count} of ${total}`}
      disablePadding
      classNamePrefix={classNamePrefix}
      className={className}
    />
  );
};

export default memo(Footer);
