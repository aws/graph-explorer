import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactElement } from "react";
import { useMemo } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { getChildrenOfType } from "../../utils";
import getChildOfType from "../../utils/getChildOfType";
import WorkspaceFooter from "./components/WorkspaceFooter";
import WorkspaceNavBar from "./components/WorkspaceNavBar";
import WorkspacesContent from "./components/WorkspacesContent";
import WorkspaceSideBar from "./components/WorkspaceSideBar";
import WorkspaceTopBar from "./components/WorkspaceTopBar";
import styles from "./Workspace.styles";

export type WorkspaceProps = {
  orientation?: "vertical" | "horizontal";
  classNamePrefix?: string;
  className?: string;
};

interface WorkspaceComposition {
  TopBar: typeof WorkspaceTopBar;
  Content: typeof WorkspacesContent;
  SideBar: typeof WorkspaceSideBar;
  NavBar: typeof WorkspaceNavBar;
  Footer: typeof WorkspaceFooter;
}

const Workspace = ({
  orientation = "vertical",
  children,
  classNamePrefix = "ft",
  className,
}: PropsWithChildren<WorkspaceProps>) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const topBarSection = useMemo(() => {
    return getChildrenOfType(
      children,
      WorkspaceTopBar.displayName || WorkspaceTopBar.name
    );
  }, [children]);

  const contentSection = useMemo(() => {
    return getChildOfType(
      children,
      WorkspacesContent.displayName || WorkspacesContent.name
    );
  }, [children]);
  const sidebarSection = useMemo(() => {
    return getChildOfType(
      children,
      WorkspaceSideBar.displayName || WorkspaceSideBar.name
    );
  }, [children]);
  const navBarSection = useMemo(() => {
    return getChildOfType(
      children,
      WorkspaceNavBar.displayName || WorkspaceNavBar.name
    );
  }, [children]);

  const footerSection = useMemo(() => {
    return getChildOfType(
      children,
      WorkspaceFooter.displayName || WorkspaceFooter.name
    );
  }, [children]);

  return (
    <div
      className={cx(
        stylesWithTheme(styles.baseStyles("ft")),
        className,
        pfx("connected-toolkit-layout"),
        pfx(`layout-${orientation}`)
      )}
    >
      {navBarSection}
      <div className={pfx("container")}>
        {topBarSection}
        <div className={pfx("main")}>
          <div className={pfx("content-footer-section")}>
            <div
              className={cx(
                stylesWithTheme(styles.contentSectionStyles),
                pfx("content-section")
              )}
            >
              {contentSection}
            </div>
            <div
              className={cx(
                stylesWithTheme(styles.footerSectionStyles),
                pfx("footer-section")
              )}
            >
              {footerSection}
            </div>
          </div>
          {sidebarSection}
        </div>
      </div>
    </div>
  );
};

Workspace.TopBar = WorkspaceTopBar;
Workspace.NavBar = WorkspaceNavBar;
Workspace.Content = WorkspacesContent;
Workspace.SideBar = WorkspaceSideBar;
Workspace.Footer = WorkspaceFooter;

export default Workspace as ((
  props: PropsWithChildren<WorkspaceProps>
) => ReactElement) &
  WorkspaceComposition;
