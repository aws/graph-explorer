import type { PropsWithChildren } from "react";

const WorkspaceNavBar = ({
  children,
}: PropsWithChildren<Record<string, never>>) => {
  return <>{children}</>;
};

WorkspaceNavBar.displayName = "WorkspaceNavBar";

export default WorkspaceNavBar;
