import { cx } from "@emotion/css";
import type { PropsWithChildren, ReactNode } from "react";
import { useWithTheme } from "../../core";
import Button from "../Button/Button";
import styles from "./PanelEmptyState.styles";

export type PanelEmptyStateProps = {
  variant?: "info" | "waiting" | "warning" | "error";
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
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
  size = "md",
  actionId,
  onAction,
  actionLabel,
  layout = "vertical",
}: PropsWithChildren<PanelEmptyStateProps>) => {
  const styleWithTheme = useWithTheme();
  return (
    <div
      className={cx(
        className,
        "panel-empty-state-wrapper",
        `panel-empty-state-${layout}`,
        styleWithTheme(styles(variant, size))
      )}
    >
      {icon && (
        <div className={"indicator-wrapper"}>
          <div className={"indicator"}>{icon}</div>
        </div>
      )}
      <div className={"panel-empty-state-text-container"}>
        {title && <h1 className={"panel-empty-state-title"}>{title}</h1>}
        {subtitle && (
          <h2 className={"panel-empty-state-subtitle"}>{subtitle}</h2>
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
