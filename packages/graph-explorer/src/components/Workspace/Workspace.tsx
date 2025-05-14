import { cn, getChildrenOfType } from "@/utils";
import type { PropsWithChildren, ReactElement } from "react";
import getChildOfType from "@/utils/getChildOfType";
import WorkspaceFooter from "./components/WorkspaceFooter";
import WorkspaceNavBar from "./components/WorkspaceNavBar";
import WorkspacesContent from "./components/WorkspacesContent";
import WorkspaceSideBar from "./components/WorkspaceSideBar";
import WorkspaceTopBar from "./components/WorkspaceTopBar";

export type WorkspaceProps = {
  orientation?: "vertical" | "horizontal";
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
  className,
}: PropsWithChildren<WorkspaceProps>) => {
  const topBarSection = getChildrenOfType(
    children,
    WorkspaceTopBar.displayName || WorkspaceTopBar.name
  );

  const contentSection = getChildOfType(
    children,
    WorkspacesContent.displayName || WorkspacesContent.name
  );
  const sidebarSection = getChildOfType(
    children,
    WorkspaceSideBar.displayName || WorkspaceSideBar.name
  );
  const navBarSection = getChildOfType(
    children,
    WorkspaceNavBar.displayName || WorkspaceNavBar.name
  );

  const footerSection = getChildOfType(
    children,
    WorkspaceFooter.displayName || WorkspaceFooter.name
  );

  return (
    <div
      className={cn(
        "bg-background-secondary flex h-full w-full grow flex-row overflow-hidden",
        className
      )}
    >
      {navBarSection}
      <div className="flex h-full grow flex-col overflow-hidden">
        {topBarSection}
        <div className="flex h-full grow flex-row overflow-auto">
          <div className="flex h-full grow flex-col overflow-auto">
            <div
              className={cn(
                "flex h-full grow gap-2 overflow-auto p-2",
                orientation === "vertical" ? "flex-col" : "flex-row"
              )}
            >
              {contentSection}
            </div>
            <div className="flex w-full flex-col">{footerSection}</div>
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
) => ReactElement<any>) &
  WorkspaceComposition;
