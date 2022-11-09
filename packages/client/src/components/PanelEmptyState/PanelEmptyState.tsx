import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactNode } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import Button from "../Button/Button";
import styles from "./PanelEmptyState.styles";

export type PanelEmptyStateProps = {
  variant?: "info" | "waiting" | "warning" | "error";
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  classNamePrefix?: string;
  size?: "xs" | "sm" | "md" | "lg";
  onAction?: () => void;
  actionId?: string;
  actionLabel?: string;
  layout?: "horizontal" | "vertical";
};

const PanelEmptyState = ({
  children,
  variant = "info",
  icon,
  title,
  subtitle,
  className,
  classNamePrefix = "ft",
  size = "md",
  actionId,
  onAction,
  actionLabel,
  layout = "vertical",
}: PropsWithChildren<PanelEmptyStateProps>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const styleWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        className,
        pfx("panel-empty-state-wrapper"),
        pfx(`panel-empty-state-${layout}`),
        styleWithTheme(styles(classNamePrefix, variant, size))
      )}
    >
      {icon && (
        <div className={pfx("indicator-wrapper")}>
          <div className={pfx("indicator")}>{icon}</div>
        </div>
      )}
      <div className={pfx("panel-empty-state-text-container")}>
        {title && <h1 className={pfx("panel-empty-state-title")}>{title}</h1>}
        {subtitle && (
          <h2 className={pfx("panel-empty-state-subtitle")}>{subtitle}</h2>
        )}
        {onAction && actionLabel && (
          <Button id={actionId} onPress={onAction} variant="text">
            {actionLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default PanelEmptyState;
