import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarContentProps = {
  className?: string;
  classNamePrefix?: string;
};

const WorkspaceTopBarContent = ({
  className,
  classNamePrefix = "ft",
  children,
}: PropsWithChildren<WorkspaceTopBarContentProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        stylesWithTheme(styles.topBarTitleContent),
        pfx("top-bar-content"),
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarContent.displayName = "WorkspaceTopBarContent";

export default WorkspaceTopBarContent;
