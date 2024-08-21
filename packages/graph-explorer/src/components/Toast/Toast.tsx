import { cx } from "@emotion/css";
import { FC, PropsWithChildren } from "react";
import { useWithTheme } from "@/core";
import Card from "../Card";

import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from "@/components/icons";
import defaultStyles from "./Toast.styles";

export type NotificationComponentProps = PropsWithChildren<{
  message: string;
  title?: string;
  type?: "error" | "warning" | "info" | "success";

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

const icons: Record<"error" | "warning" | "info" | "success", typeof InfoIcon> =
  {
    error: ErrorIcon,
    warning: ErrorIcon,
    info: InfoIcon,
    success: CheckIcon,
  };

export const Toast: FC<ToastProps> = ({
  children,
  className,
  type = "info",
  title,
  closeable = true,
  onClose,
}) => {
  const stylesWithTheme = useWithTheme();

  const Icon = icons[type];
  return (
    <div className={cx(stylesWithTheme(defaultStyles), className)}>
      <Card className={cx("card", type)} transparent>
        <div className={"icon"}>
          <Icon width={24} height={24} />
        </div>
        <div className={"content"}>
          {title && <div className={"title"}>{title}</div>}
          {children}
        </div>
        {closeable && (
          <div
            className={cx("close-container", {
              ["close-container-no-title"]: !title,
            })}
          >
            <div onClick={onClose} style={{ height: 16 }}>
              <CloseIcon width={16} height={16} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Toast;
