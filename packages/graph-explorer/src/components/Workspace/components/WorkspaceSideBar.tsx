import { cn } from "@/utils";
import { useState, type PropsWithChildren, type ReactElement } from "react";
import getChildOfType from "@/utils/getChildOfType";
import getChildrenOfType from "@/utils/getChildrenOfType";
import WorkspaceSideBarContent from "./WorkspaceSideBarContent";
import { Resizable } from "re-resizable";
import {
  CLOSED_SIDEBAR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  useSidebar,
  useSidebarSize,
} from "@/core";

interface WorkspaceSideBarComposition {
  Content: typeof WorkspaceSideBarContent;
}

export type WorkspaceSideBarProps = {
  direction?: "row" | "row-reverse";
};

function ResizableSidebar({ children }: PropsWithChildren) {
  const { isSidebarOpen } = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useSidebarSize();

  // The transition animation used for opening and closing sidebar animation
  // does not play well with the resizing behavior of the Resizable component.
  // If the animation is not disabled, the resize will feel jerky.
  const [enableAnimation, setEnableAnimation] = useState(true);

  return (
    <Resizable
      size={{ width: isSidebarOpen ? sidebarWidth : CLOSED_SIDEBAR_WIDTH }}
      minWidth={isSidebarOpen ? DEFAULT_SIDEBAR_WIDTH : CLOSED_SIDEBAR_WIDTH}
      defaultSize={{
        width: isSidebarOpen ? DEFAULT_SIDEBAR_WIDTH : CLOSED_SIDEBAR_WIDTH,
      }}
      enable={{ left: isSidebarOpen }}
      onResizeStart={() => setEnableAnimation(false)}
      onResizeStop={(_e, _direction, _ref, delta) => {
        setEnableAnimation(true);
        setSidebarWidth(delta.width);
      }}
      className={cn(
        enableAnimation &&
          "transition-width transform duration-200 ease-in-out",
      )}
    >
      {children}
    </Resizable>
  );
}

const WorkspaceSideBar = ({
  children,
  direction = "row",
}: PropsWithChildren<WorkspaceSideBarProps>) => {
  const sidebarContent = getChildOfType(
    children,
    WorkspaceSideBarContent.displayName || WorkspaceSideBarContent.name,
  );

  const sidebarActions = getChildrenOfType(
    children,
    WorkspaceSideBarContent.displayName || WorkspaceSideBarContent.name,
    true,
  );

  return (
    <ResizableSidebar>
      <div
        className={cn(
          "bg-background-default shadow-primary-foreground/25 flex h-full shadow",
          direction === "row" && "flex-row",
          direction === "row-reverse" && "flex-row-reverse",
        )}
      >
        <div className="bg-secondary-subtle dark:text-brand-100 text-primary-dark flex flex-col gap-2 p-2 dark:bg-gray-900">
          {sidebarActions}
        </div>
        {sidebarContent}
      </div>
    </ResizableSidebar>
  );
};

WorkspaceSideBar.displayName = "WorkspaceSideBar";

WorkspaceSideBar.Content = WorkspaceSideBarContent;

export default WorkspaceSideBar as ((
  props: PropsWithChildren<WorkspaceSideBarProps>,
) => ReactElement<any>) &
  WorkspaceSideBarComposition & { displayName: string };
