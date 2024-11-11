import type { PropsWithChildren, ReactNode } from "react";
import Button, { ButtonProps } from "../Button/Button";
import { cva } from "cva";
import { cn } from "@/utils";

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
  const variantStyles = cva({
    variants: {
      variant: {
        info: "from-primary-main to-primary-light bg-gradient-to-b shadow-[0_0_20px_2px_hsl(205,95%,71%,70%)]",
        error:
          "from-error-main to-error-light bg-gradient-to-b shadow-[0_0_20px_2px_rgba(255,144,119,0.7)]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  });

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center",
        className
      )}
    >
      {icon && (
        <div className="mb-6">
          <div
            className={cn(
              "flex size-24 items-center justify-center rounded-full text-7xl text-white [&>svg]:size-[60%]",
              variantStyles({ variant })
            )}
          >
            {icon}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          {title && (
            <h1 className="text-text-primary text-lg font-bold">{title}</h1>
          )}
          {subtitle && (
            <h2 className="text-text-secondary font-base text-base">
              {subtitle}
            </h2>
          )}
        </div>
        {onAction && actionLabel && (
          <Button id={actionId} onPress={onAction} variant={actionVariant}>
            {actionLabel}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default PanelEmptyState;
