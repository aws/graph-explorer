import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import styles from "../Workspace.styles";

export type WorkspaceTopBarAdditionalControlsProps = {
  className?: string;
  classNamePrefix?: string;
};

const WorkspaceTopBarAdditionalControls = ({
  className,
  classNamePrefix = "ft",
  children,
}: PropsWithChildren<WorkspaceTopBarAdditionalControlsProps>) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <div
      className={cx(
        stylesWithTheme(styles.additionalControlsSectionStyles),
        pfx("additional-controls-section-container"),
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
