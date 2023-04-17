import { cx } from "@emotion/css";
import type { ForwardedRef, PropsWithChildren } from "react";
import { forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import defaultStyles from "./Sidebar.styles";
import SidebarButton from "./SidebarButton";

export type SidebarLeftProps = {
  classNamePrefix?: string;
  className?: string;
};

export type SidebarLeftComposition = {
  Button: typeof SidebarButton;
};

const SidebarLeft = (
  {
    children,
    classNamePrefix = "ft",
    className,
  }: PropsWithChildren<SidebarLeftProps>,
  ref?: ForwardedRef<HTMLDivElement>
) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      ref={ref}
      className={cx(
        stylesWithTheme(defaultStyles(classNamePrefix)),
        pfx("left-sidebar"),
        className
      )}
    >
      {children}
    </div>
  );
};

const T = (forwardRef(SidebarLeft) as unknown) as SidebarLeftComposition &
  ((
    props: PropsWithChildren<PropsWithChildren<SidebarLeftProps>> & {
      ref?: ForwardedRef<HTMLDivElement>;
    }
  ) => ReturnType<typeof SidebarLeft>);

T.Button = SidebarButton;

export default T;
