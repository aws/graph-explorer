import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarContentProps = {
  className?: string;
};

const WorkspaceTopBarContent = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarContentProps>) => {
  const stylesWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        stylesWithTheme(styles.topBarTitleContent),
        "top-bar-content",
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarContent.displayName = "WorkspaceTopBarContent";

export default WorkspaceTopBarContent;
