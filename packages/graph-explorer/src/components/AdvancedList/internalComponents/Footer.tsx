import { memo } from "react";
import Section from "@/components/Section";

type FooterProps = {
  count: number;
  total: number;
  className: string;
};

const Footer = ({ count, total, className }: FooterProps) => {
  return (
    <Section
      showWhenEmpty
      title={`Showing ${count} of ${total}`}
      disablePadding
      className={className}
    />
  );
};

export default memo(Footer);
