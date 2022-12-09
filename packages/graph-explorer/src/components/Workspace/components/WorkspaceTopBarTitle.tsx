import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../../core";
import IconButton from "../../IconButton";
import ChevronLeftIcon from "../../icons/ChevronLeftIcon";
import styles from "../Workspace.styles";

export type WorkspaceTopBarTitleProps = {
  className?: string;
  classNamePrefix?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  withBackButton?: boolean;
  onBack?: () => void;
};

const WorkspaceTopBarTitle = ({
  className,
  classNamePrefix = "ft",
  withBackButton,
  onBack,
  title,
  subtitle,
  children,
}: PropsWithChildren<WorkspaceTopBarTitleProps>) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  return (
    <div
      className={cx(
        stylesWithTheme(styles.titleContainerStyles(withBackButton)),
        className
      )}
    >
      {withBackButton && (
        <IconButton
          variant="text"
          icon={<ChevronLeftIcon />}
          onPress={onBack}
        />
      )}
      <div
        className={cx(
          stylesWithTheme(styles.titleSectionStyles(classNamePrefix || "ft")),
          pfx("title-section-container")
        )}
      >
        {title && <div className={pfx("title")}>{title}</div>}
        {subtitle && <div className={pfx("subtitle")}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
};

WorkspaceTopBarTitle.displayName = "WorkspaceTopBarTitle";

export default WorkspaceTopBarTitle;
