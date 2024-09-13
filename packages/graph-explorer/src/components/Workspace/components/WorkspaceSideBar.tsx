import { cn } from "@/utils";
import type { PropsWithChildren, ReactElement } from "react";
import { useMemo } from "react";
import getChildOfType from "@/utils/getChildOfType";
import getChildrenOfType from "@/utils/getChildrenOfType";
import Sidebar from "@/components/Sidebar";
import SidebarButton from "@/components/Sidebar/SidebarButton";
import WorkspaceSideBarContent from "./WorkspaceSideBarContent";

interface WorkspaceSideBarComposition {
  Button: typeof SidebarButton;
  Content: typeof WorkspaceSideBarContent;
}

export type WorkspaceSideBarProps = {
  direction?: "row" | "row-reverse";
};

const WorkspaceSideBar = ({
  children,
  direction = "row",
}: PropsWithChildren<WorkspaceSideBarProps>) => {
  const sidebarContent = useMemo(() => {
    return getChildOfType(
      children,
      WorkspaceSideBarContent.displayName || WorkspaceSideBarContent.name
    );
  }, [children]);

  const sidebarActions = useMemo(() => {
    return getChildrenOfType(
      children,
      WorkspaceSideBarContent.displayName || WorkspaceSideBarContent.name,
      true
    );
  }, [children]);

  return (
    <div
      className={cn(
        "shadow-left bg-background-default flex",
        direction === "row" && "flex-row",
        direction === "row-reverse" && "flex-row-reverse"
      )}
    >
      <Sidebar>{sidebarActions}</Sidebar>
      {sidebarContent}
    </div>
  );
};

WorkspaceSideBar.displayName = "WorkspaceSideBar";

WorkspaceSideBar.Button = SidebarButton;
WorkspaceSideBar.Content = WorkspaceSideBarContent;

export default WorkspaceSideBar as ((
  props: PropsWithChildren<WorkspaceSideBarProps>
) => ReactElement) &
  WorkspaceSideBarComposition & { displayName: string };
