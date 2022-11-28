import type { PropsWithChildren } from "react";

const WorkspaceFooter = ({
  children,
}: PropsWithChildren<Record<string, never>>) => {
  return <>{children}</>;
};

WorkspaceFooter.displayName = "WorkspaceFooter";

export default WorkspaceFooter;
