import { cx } from "@emotion/css";
import { FC } from "react";
import { useWithTheme, withClassNamePrefix } from "../../core";
import Card from "../Card";

import { CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from "../icons";
import defaultStyles from "./Toast.styles";

export type NotificationComponentProps = {
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
};

export interface ToastProps
  extends Omit<NotificationComponentProps, "message"> {
  classNamePrefix?: string;
  className?: string;
}

const icons: Record<
  "error" | "warning" | "info" | "success",
  typeof InfoIcon
> = {
  error: ErrorIcon,
  warning: ErrorIcon,
  info: InfoIcon,
  success: CheckIcon,
};

export const Toast: FC<ToastProps> = ({
  children,
  classNamePrefix = "ft",
  className,
  type = "info",
  title,
  closeable = true,
  onClose,
}) => {
  const stylesWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);

  const Icon = icons[type];
  return (
    <div
      className={cx(stylesWithTheme(defaultStyles(classNamePrefix)), className)}
    >
      <Card className={cx(pfx("card"), pfx(type))} transparent>
        <div className={pfx("icon")}>
          <Icon width={24} height={24} />
        </div>
        <div className={pfx("content")}>
          {title && <div className={pfx("title")}>{title}</div>}
          {children}
        </div>
        {closeable && (
          <div
            className={cx(pfx("close-container"), {
              [pfx("close-container-no-title")]: !title,
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
