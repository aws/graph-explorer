import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarVersionProps = {
  className?: string;
  classNamePrefix?: string;
};

const WorkspaceTopBarVersion = ({
  className,
  classNamePrefix = "ft",
  children,
}: PropsWithChildren<WorkspaceTopBarVersionProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        stylesWithTheme(styles.topBarTitleVersion),
        pfx("top-bar-version"),
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarVersion.displayName = "WorkspaceTopBarVersion";

export default WorkspaceTopBarVersion;
