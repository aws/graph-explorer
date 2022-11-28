import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../../core";
import defaultStyles from "./SelectHeader.styles";

interface SelectHeaderProps {
  className?: string;
  classNamePrefix?: string;
  title?: string;
  subtitle?: string;
}

const SelectHeader = ({
  classNamePrefix = "ft",
  className,
  title,
  subtitle,
}: PropsWithChildren<SelectHeaderProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const styleWithTheme = useWithTheme();
  if (!title && !subtitle) {
    return null;
  }
  return (
    <div
      className={cx(styleWithTheme(defaultStyles(classNamePrefix)), className)}
    >
      {title && <div className={pfx("select-header-title")}>{title}</div>}
      {subtitle && (
        <div className={pfx("select-header-subtitle")}>{subtitle}</div>
      )}
    </div>
  );
};

export default SelectHeader;
