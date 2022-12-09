import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactElement } from "react";
import { useMemo } from "react";
import { withClassNamePrefix } from "../../../core";
import getChildOfType from "../../../utils/getChildOfType";
import getChildrenOfType from "../../../utils/getChildrenOfType";
import Sidebar from "../../Sidebar";
import SidebarButton from "../../Sidebar/SidebarButton";
import WorkspaceSideBarContent from "./WorkspaceSideBarContent";

interface WorkspaceSideBarComposition {
  Button: typeof SidebarButton;
  Content: typeof WorkspaceSideBarContent;
}

export type WorkspaceSideBarProps = {
  classNamePrefix?: string;
  direction?: "row" | "row-reverse";
};

const WorkspaceSideBar = ({
  children,
  classNamePrefix = "ft",
  direction = "row",
}: PropsWithChildren<WorkspaceSideBarProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
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
    <div className={cx(pfx("sidebar-section"), pfx(`direction-${direction}`))}>
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
