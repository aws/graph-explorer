import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme } from "../../../../core";
import defaultStyles from "./SelectHeader.styles";

interface SelectHeaderProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

const SelectHeader = ({
  className,
  title,
  subtitle,
}: PropsWithChildren<SelectHeaderProps>) => {
  const styleWithTheme = useWithTheme();
  if (!title && !subtitle) {
    return null;
  }
  return (
    <div className={cx(styleWithTheme(defaultStyles), className)}>
      {title && <div className={"select-header-title"}>{title}</div>}
      {subtitle && <div className={"select-header-subtitle"}>{subtitle}</div>}
    </div>
  );
};

export default SelectHeader;
