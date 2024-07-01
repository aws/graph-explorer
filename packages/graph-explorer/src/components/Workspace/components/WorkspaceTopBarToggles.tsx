import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarTogglesProps = {
  className?: string;
};

const WorkspaceTopBarToggles = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarTogglesProps>) => {
  const stylesWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        stylesWithTheme(styles.togglesSectionStyles),
        "toggles-section-container",
        className
      )}
    >
      {children}
    </div>
  );
};
WorkspaceTopBarToggles.displayName = "WorkspaceTopBarToggles";

export default WorkspaceTopBarToggles;
