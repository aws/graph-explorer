import { cx } from "@emotion/css";
import type { ForwardedRef, PropsWithChildren } from "react";
import { forwardRef } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import defaultStyles from "./Sidebar.styles";
import SidebarButton from "./SidebarButton";

export type SidebarProps = {
  classNamePrefix?: string;
  className?: string;
};

export type SidebarComposition = {
  Button: typeof SidebarButton;
};

const Sidebar = (
  {
    children,
    classNamePrefix = "ft",
    className,
  }: PropsWithChildren<SidebarProps>,
  ref?: ForwardedRef<HTMLDivElement>
) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  return (
    <div
      ref={ref}
      className={cx(
        stylesWithTheme(defaultStyles(classNamePrefix)),
        pfx("sidebar"),
        className
      )}
    >
      {children}
    </div>
  );
};

const T = (forwardRef(Sidebar) as unknown) as SidebarComposition &
  ((
    props: PropsWithChildren<PropsWithChildren<SidebarProps>> & {
      ref?: ForwardedRef<HTMLDivElement>;
    }
  ) => ReturnType<typeof Sidebar>);

T.Button = SidebarButton;

export default T;
