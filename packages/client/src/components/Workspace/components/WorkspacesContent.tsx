import type { PropsWithChildren } from "react";

const WorkspacesContent = ({ children }: PropsWithChildren<unknown>) => {
  return <>{children}</>;
};

WorkspacesContent.displayName = "WorkspacesContent";

export default WorkspacesContent;
