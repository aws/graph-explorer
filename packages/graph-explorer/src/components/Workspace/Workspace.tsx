import { cn, getChildrenOfType } from "@/utils";
import type { PropsWithChildren, ReactElement } from "react";
import getChildOfType from "@/utils/getChildOfType";
import WorkspacesContent from "./components/WorkspacesContent";
import WorkspaceSideBar from "./components/WorkspaceSideBar";
import WorkspaceTopBar from "./components/WorkspaceTopBar";

export type WorkspaceProps = {
  className?: string;
};

interface WorkspaceComposition {
  TopBar: typeof WorkspaceTopBar;
  Content: typeof WorkspacesContent;
  SideBar: typeof WorkspaceSideBar;
}

const Workspace = ({
  children,
  className,
}: PropsWithChildren<WorkspaceProps>) => {
  const topBarSection = getChildrenOfType(
    children,
    WorkspaceTopBar.displayName || WorkspaceTopBar.name,
  );

  const contentSection = getChildOfType(
    children,
    WorkspacesContent.displayName || WorkspacesContent.name,
  );
  const sidebarSection = getChildOfType(
    children,
    WorkspaceSideBar.displayName || WorkspaceSideBar.name,
  );

  return (
    <div
      className={cn(
        "bg-brand-100 flex h-full w-full grow flex-col overflow-hidden",
        className,
      )}
    >
      {topBarSection}
      <div className="flex h-full grow flex-row overflow-auto">
        {contentSection}
        {sidebarSection}
      </div>
    </div>
  );
};

Workspace.TopBar = WorkspaceTopBar;
Workspace.Content = WorkspacesContent;
Workspace.SideBar = WorkspaceSideBar;

export default Workspace as ((
  props: PropsWithChildren<WorkspaceProps>,
) => ReactElement<any>) &
  WorkspaceComposition;
