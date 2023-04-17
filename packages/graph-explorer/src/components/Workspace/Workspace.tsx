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

  //Apotheca additions============================================
import WorkspaceSideBarLeft from "./components/Ap-WorkspaceSideBarLeft"
//// ----------this may be unneccessary--------
//import WorkspaceSideBarContentLeft from "./components/Ap-WorkspaceSideBarContentLeft"

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
  //Apotheca additions============================================
  SideBarLeft: typeof WorkspaceSideBarLeft;
  //// ----------this may be unneccessary--------
  //SideBarContentLeft: typeof WorkspaceSideBarContentLeft;
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
  //========================================================
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

  // Apotheca Addition============================================
  //// ----------this may be unneccessary--------
  //const sidebarContentLeftSection = useMemo(() => {
  //  return getChildOfType(
  //    children,
  //    WorkspaceSideBarContentLeft.displayName || WorkspaceSideBarContentLeft.name
  //  );
  //}, [children]);
    //========================================================
  const sidebarLeftSection = useMemo(() => {
    return getChildOfType(
      children,
      WorkspaceSideBarLeft.displayName || WorkspaceSideBarLeft.name
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
          {/*APOTHECA SIDEBAR HERE*/ }
        
          {sidebarLeftSection}
          
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
          {/* FOR SOME REASON THE SECOND ONE HERE IS DUPLICATING THE SIDE BARS*/ }
          
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

// Apotheca Addition============================================
//Workspace.SideBarContentLeft = WorkspaceSideBarContentLeft;
Workspace.SideBarLeft = WorkspaceSideBarLeft;

export default Workspace as ((
  props: PropsWithChildren<WorkspaceProps>
) => ReactElement) &
  WorkspaceComposition;
