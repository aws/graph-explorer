import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarAdditionalControlsProps = {
  className?: string;
};

const WorkspaceTopBarAdditionalControls = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarAdditionalControlsProps>) => {
  const stylesWithTheme = useWithTheme();

  return (
    <div
      className={cx(
        stylesWithTheme(styles.additionalControlsSectionStyles),
        "additional-controls-section-container",
        className
      )}
    >
      {children}
    </div>
  );
};

WorkspaceTopBarAdditionalControls.displayName =
  "WorkspaceTopBarAdditionalControls";

export default WorkspaceTopBarAdditionalControls;
