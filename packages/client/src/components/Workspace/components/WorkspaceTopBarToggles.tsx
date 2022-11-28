import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarTogglesProps = {
  className?: string;
  classNamePrefix?: string;
};

const WorkspaceTopBarToggles = ({
  className,
  classNamePrefix = "ft",
  children,
}: PropsWithChildren<WorkspaceTopBarTogglesProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const stylesWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        stylesWithTheme(styles.togglesSectionStyles),
        pfx("toggles-section-container"),
        className
      )}
    >
      {children}
    </div>
  );
};
WorkspaceTopBarToggles.displayName = "WorkspaceTopBarToggles";

export default WorkspaceTopBarToggles;
