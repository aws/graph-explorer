import { cn } from "@/utils";
import type { PropsWithChildren, ReactElement } from "react";
import getChildOfType from "@/utils/getChildOfType";
import getChildrenOfType from "@/utils/getChildrenOfType";
import WorkspaceSideBarContent from "./WorkspaceSideBarContent";

interface WorkspaceSideBarComposition {
  Content: typeof WorkspaceSideBarContent;
}

export type WorkspaceSideBarProps = {
  direction?: "row" | "row-reverse";
};

const WorkspaceSideBar = ({
  children,
  direction = "row",
}: PropsWithChildren<WorkspaceSideBarProps>) => {
  const sidebarContent = getChildOfType(
    children,
    WorkspaceSideBarContent.displayName || WorkspaceSideBarContent.name
  );

  const sidebarActions = getChildrenOfType(
    children,
    WorkspaceSideBarContent.displayName || WorkspaceSideBarContent.name,
    true
  );

  return (
    <div
      className={cn(
        "shadow-left bg-background-default flex",
        direction === "row" && "flex-row",
        direction === "row-reverse" && "flex-row-reverse"
      )}
    >
      <div className="bg-background-secondary-subtle text-primary-dark dark:text-brand-100 shadow-primary-dark/20 flex flex-col gap-2 p-2 shadow dark:bg-gray-900">
        {sidebarActions}
      </div>
      {sidebarContent}
    </div>
  );
};

WorkspaceSideBar.displayName = "WorkspaceSideBar";

WorkspaceSideBar.Content = WorkspaceSideBarContent;

export default WorkspaceSideBar as ((
  props: PropsWithChildren<WorkspaceSideBarProps>
) => ReactElement<any>) &
  WorkspaceSideBarComposition & { displayName: string };
