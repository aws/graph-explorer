import type { PropsWithChildren, ReactNode } from "react";
import Button, { ButtonProps } from "../Button/Button";
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateSubtitle,
  EmptyStateTitle,
} from "./EmptyState";

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
      <EmptyStateHeader>
        {title && <EmptyStateTitle>{title}</EmptyStateTitle>}
        {subtitle && <EmptyStateSubtitle>{subtitle}</EmptyStateSubtitle>}
      </EmptyStateHeader>
      {onAction && actionLabel && (
        <Button id={actionId} onPress={onAction} variant={actionVariant}>
          {actionLabel}
        </Button>
      )}
      {children}
    </EmptyState>
  );
};

export default PanelEmptyState;
