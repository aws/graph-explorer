import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarVersionProps = {
  className?: string;
};

const WorkspaceTopBarVersion = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarVersionProps>) => {
  const stylesWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        stylesWithTheme(styles.topBarTitleVersion),
        "top-bar-version",
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarVersion.displayName = "WorkspaceTopBarVersion";

export default WorkspaceTopBarVersion;
