import { css } from "@emotion/css";
import { createContext, CSSProperties, FC, useCallback } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { v4 } from "uuid";

import { initialState, Notification, NotificationState } from "./reducer";
import useManager from "./useManager";

export type NotificationContextValue = {
  state: NotificationState;
  enqueueNotification: (notification: Notification) => string;
  clearNotification: (notificationId: string) => void;
};

const voidFn = () => "";

const styles = css`
  .item-enter {
    opacity: 0;
    position: relative;
  }

  .item-enter-active {
    opacity: 1;
    transition: all 200ms ease-in;
  }

  .item-exit {
    opacity: 1;
  }

  .item-exit-active {
    opacity: 0;
    transition: all 200ms ease-in;
  }
`;

export const NotificationContext = createContext<NotificationContextValue>({
  state: initialState,
  enqueueNotification: voidFn,
  clearNotification: voidFn,
});

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

type AnchorHorizontal = "left" | "center" | "right";
type AnchorVertical = "top" | "bottom";
export type NotificationProviderProps = {
  component: FC<NotificationComponentProps>;

  /**
   * The default anchor for every notification except it overrides its anchorOrigin.
   */
  anchorOrigin?: {
    horizontal?: AnchorHorizontal;
    vertical?: AnchorVertical;
  };
};

const anchorOriginStyleMap: Record<
  AnchorHorizontal | AnchorVertical,
  CSSProperties
> = {
  left: { left: 16 },
  center: {
    left: 0,
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  right: { right: 16 },
  top: { top: 16 },
  bottom: { bottom: 16 },
};

export const NotificationProvider: FC<NotificationProviderProps> = ({
  children,
  component,
  anchorOrigin = {
    horizontal: "right",
    vertical: "bottom",
  },
}) => {
  const {
    state,
    dispatchNotification,
    cancelTimeout,
    resumeTimeout,
  } = useManager();

  const Component = component;
  const actualAnchorOrigin: Required<
    NotificationProviderProps["anchorOrigin"]
  > = {
    horizontal: anchorOrigin?.horizontal || "right",
    vertical: anchorOrigin?.vertical || "bottom",
  };
  const enqueueNotification = useCallback(
    (notification: Notification) => {
      const id = v4();
      dispatchNotification({
        type: "enqueue",
        payload: { id, ...notification },
      });

      return notification.id || id;
    },
    [dispatchNotification]
  );

  const clearNotification = useCallback(
    (notificationId: string) => {
      dispatchNotification({
        type: "clear",
        payload: { id: notificationId },
      });
    },
    [dispatchNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        state,
        enqueueNotification,
        clearNotification,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
        className={styles}
      >
        {children}
        <div
          style={{
            position: "fixed",
            zIndex: 9999999,
            pointerEvents: "none",
            ...anchorOriginStyleMap[actualAnchorOrigin.horizontal],
            ...anchorOriginStyleMap[actualAnchorOrigin.vertical],
          }}
        >
          <TransitionGroup
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
            }}
          >
            {state.active.map(notification => (
              <CSSTransition
                key={notification.id}
                timeout={200}
                classNames={"item"}
                style={{
                  pointerEvents: "all",
                  ...(notification.anchorOrigin
                    ? {
                        position: "fixed",
                        ...anchorOriginStyleMap[
                          notification.anchorOrigin.horizontal || "right"
                        ],
                        ...anchorOriginStyleMap[
                          notification.anchorOrigin.vertical || "bottom"
                        ],
                      }
                    : {}),
                }}
              >
                <div
                  key={notification.id}
                  onMouseLeave={() => {
                    resumeTimeout(notification);
                  }}
                  onMouseOver={() => {
                    cancelTimeout(notification);
                  }}
                >
                  <Component
                    {...notification}
                    onClose={() => {
                      dispatchNotification({
                        type: "clear",
                        payload: notification,
                      });
                      dispatchNotification({
                        type: "next",
                      });
                    }}
                  >
                    <span style={{ maxWidth: 400, wordWrap: "break-word" }}>
                      {notification.message}
                    </span>
                  </Component>
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
