import type { PropsWithChildren, ReactNode } from "react";

import { Button, type ButtonProps } from "../Button/Button";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "../EmptyState";

export type PanelEmptyStateProps = {
  variant?: "info" | "error";
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  onAction?: () => void;
  actionId?: string;
  actionLabel?: string;
  actionVariant?: ButtonProps["variant"];
};

const PanelEmptyState = ({
  children,
  variant = "info",
  icon,
  title,
  subtitle,
  className,
  actionId,
  onAction,
  actionLabel,
  actionVariant,
}: PropsWithChildren<PanelEmptyStateProps>) => {
  return (
    <EmptyState className={className}>
      {icon && <EmptyStateIcon variant={variant}>{icon}</EmptyStateIcon>}
      <EmptyStateContent>
        {title && <EmptyStateTitle>{title}</EmptyStateTitle>}
        {subtitle && <EmptyStateDescription>{subtitle}</EmptyStateDescription>}
        {onAction && actionLabel && (
          <EmptyStateActions>
            <Button id={actionId} onClick={onAction} variant={actionVariant}>
              {actionLabel}
            </Button>
          </EmptyStateActions>
        )}
        {children}
      </EmptyStateContent>
    </EmptyState>
  );
};

export default PanelEmptyState;
