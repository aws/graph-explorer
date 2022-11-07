import { cx } from "@emotion/css";
import type { ForwardedRef, PropsWithChildren, ReactNode } from "react";
import { Children, forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import Card from "../Card/Card";
import defaultStyles from "./Banner.styles";

export interface BannerProps {
  classNamePrefix?: "ft";
  className?: string;
  startAdornment?: ReactNode;
  title?: string;
  subtitle?: string;
}

export const Banner = (
  {
    className,
    classNamePrefix = "ft",
    children,
    startAdornment,
    title,
    subtitle,
  }: PropsWithChildren<BannerProps>,
  ref: ForwardedRef<HTMLDivElement>
): React.ReactElement => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const childrenArray = Children.toArray(children);
  return (
    <Card
      ref={ref}
      classNamePrefix={classNamePrefix}
      className={cx(styleWithTheme(defaultStyles(classNamePrefix)), className)}
      elevation={0}
    >
      <div className={pfx("main")}>
        {startAdornment && (
          <div className={pfx("start-adornment")}>{startAdornment}</div>
        )}
        <div className={pfx("main-content")}>
          <div className={pfx("title")}>{title}</div>
          <div className={pfx("subtitle")}>{subtitle}</div>
        </div>
      </div>
      <div className={pfx("children-container")}>
        {childrenArray.map((child, childIndex) => {
          return (
            <div key={childIndex} className={pfx("container")}>
              {child}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default forwardRef<HTMLDivElement, PropsWithChildren<BannerProps>>(
  Banner
);
