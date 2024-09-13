import { cn } from "@/utils";
import type { ForwardedRef, PropsWithChildren } from "react";
import { forwardRef } from "react";
import { useWithTheme } from "@/core";
import defaultStyles from "./Sidebar.styles";
import SidebarButton from "./SidebarButton";

export type SidebarProps = {
  className?: string;
};

export type SidebarComposition = {
  Button: typeof SidebarButton;
};

const Sidebar = (
  { children, className }: PropsWithChildren<SidebarProps>,
  ref?: ForwardedRef<HTMLDivElement>
) => {
  const stylesWithTheme = useWithTheme();

  return (
    <div
      ref={ref}
      className={cn(stylesWithTheme(defaultStyles), "sidebar", className)}
    >
      {children}
    </div>
  );
};

const T = forwardRef(Sidebar) as unknown as SidebarComposition &
  ((
    props: PropsWithChildren<PropsWithChildren<SidebarProps>> & {
      ref?: ForwardedRef<HTMLDivElement>;
    }
  ) => ReturnType<typeof Sidebar>);

T.Button = SidebarButton;

export default T;
