import { PropsWithChildren } from "react";
import { cn } from "@/utils";
import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from "@/components/icons";
import { cva } from "cva";
import { IconButton } from "../IconButton";
import { Spinner } from "../LoadingSpinner";
import { NotificationType } from "../NotificationProvider/NotificationProvider";

export type NotificationComponentProps = PropsWithChildren<{
  message: string;
  title?: string;
  type?: NotificationType;

  /**
   * Enable or disable the possibility to close the notification manually
   */
  closeable?: boolean;

  /**
   * It's triggered when manually close the notification
   */
  onClose?(): void;
}>;

export interface ToastProps
  extends Omit<NotificationComponentProps, "message"> {
  className?: string;
}

const icons: Record<NotificationType, typeof InfoIcon> = {
  error: ErrorIcon,
  warning: ErrorIcon,
  info: InfoIcon,
  success: CheckIcon,
  loading: Spinner,
};

const notificationTypeStyles = cva({
  base: "fle-row flex max-w-[448px] gap-3 overflow-hidden rounded-md p-3 shadow-lg",
  variants: {
    type: {
      info: "bg-primary-main text-white",
      success: "bg-success-main text-white",
      warning: "bg-warning-main text-white",
      error: "bg-error-main text-white",
      loading: "bg-primary-main text-white",
    },
  },
});

export function Toast({
  children,
  className,
  type = "info",
  title,
  closeable = true,
  onClose,
}: ToastProps) {
  const Icon = icons[type];
  return (
    <div className={cn("relative w-fit", className)}>
      <div className={notificationTypeStyles({ type })}>
        <Icon className="size-10 shrink-0" />
        <div className="flex flex-col gap-2">
          {title && <div className="text-lg font-bold">{title}</div>}
          {children}
        </div>
        {closeable && (
          <IconButton
            icon={<CloseIcon />}
            onClick={onClose}
            variant="text"
            className="text-white"
          />
        )}
      </div>
    </div>
  );
}

export default Toast;
