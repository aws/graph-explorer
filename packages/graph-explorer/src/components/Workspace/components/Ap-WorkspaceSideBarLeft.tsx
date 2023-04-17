import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactElement } from "react";
import { useMemo } from "react";
import { withClassNamePrefix } from "../../../core";
import getChildOfType from "../../../utils/getChildOfType";
import getChildrenOfType from "../../../utils/getChildrenOfType";
//apotheca addition =======================
import SidebarLeft from "../../Sidebar/Ap-SidebarLeft";
import SidebarButton from "../../Sidebar/SidebarButton";
import WorkspaceSideBarContentLeft from "./Ap-WorkspaceSideBarContentLeft";

interface WorkspaceSideBarLeftComposition {
  Button: typeof SidebarButton;
  Content: typeof WorkspaceSideBarContentLeft;
}

export type WorkspaceSideBarLeftProps = {
  classNamePrefix?: string;
  direction?: "row" | "row-reverse";
};

const WorkspaceSideBarLeft = ({
  children,
  classNamePrefix = "ft",
  direction = "row",
}: PropsWithChildren<WorkspaceSideBarLeftProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const sidebarContent = useMemo(() => {
    return getChildOfType(
      children,
      WorkspaceSideBarContentLeft.displayName || WorkspaceSideBarContentLeft.name
    );
  }, [children]);

  const sidebarActions = useMemo(() => {
    return getChildrenOfType(
      children,
      WorkspaceSideBarContentLeft.displayName || WorkspaceSideBarContentLeft.name,
      true
    );
  }, [children]);

  return (
    <div className={cx(pfx("sidebar-section"), pfx(`direction-${direction}`))}>
      <SidebarLeft>{sidebarActions}</SidebarLeft>
      {sidebarContent}
    </div>
  );
};

WorkspaceSideBarLeft.displayName = "WorkspaceSideBarLeft";

WorkspaceSideBarLeft.Button = SidebarButton;
WorkspaceSideBarLeft.Content = WorkspaceSideBarContentLeft;

export default WorkspaceSideBarLeft as ((
  props: PropsWithChildren<WorkspaceSideBarLeftProps>
) => ReactElement) &
  WorkspaceSideBarLeftComposition & { displayName: string };
