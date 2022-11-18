import { v4 } from "uuid";
import { NotificationComponentProps } from "./NotificationProvider";

export interface Notification extends NotificationComponentProps {
  /**
   * Prior notifications will be shown first
   */
  priority?: number;

  /**
   * Allows to show a notification even if another one is currently visible
   */
  stackable?: boolean;

  /**
   * The number of milliseconds to wait before automatically dismiss the notification.
   * It is disabled with the null value.
   */
  autoHideDuration?: number | null;

  /**
   * The maximum number of milliseconds that the notification lives in the queue.
   * If the notification expires before adding it to active notifications, it will be removed.
   */
  expiryDuration?: number;

  /**
   * Allows to show the notification directly. It removes all active notifications first.
   */
  forced?: boolean;

  /**
   * The anchor origin for the notification.
   */
  anchorOrigin?: {
    horizontal?: "left" | "center" | "right";
    vertical?: "top" | "bottom";
  };

  /**
   * Optional Id for the notification, usefule when you want to remove a notification from the queue when
   * dispatching the clear action.
   */
  id?: string;
}

export interface ProcessedNotification extends Notification {
  id: string;
  priority: number;
  expiresAt?: number;
}

export interface ScheduledNotification extends ProcessedNotification {
  timeout: ReturnType<typeof setTimeout>;
}

export type NotificationState = {
  active: ProcessedNotification[];
  queue: ProcessedNotification[];
  cancelledIds: string[];
};

export const initialState: NotificationState = {
  active: [],
  queue: [],
  cancelledIds: [],
};

export type NotificationAction =
  | { type: "enqueue"; payload: Notification }
  | { type: "clear"; payload: { id: string } }
  | { type: "next" };

const reducer = (state: NotificationState, action: NotificationAction) => {
  switch (action.type) {
    case "clear":
      return {
        ...state,
        active: state.active.filter(
          notification => notification.id !== action.payload.id
        ),
        cancelledIds: [...state.cancelledIds, action.payload.id],
      };
    case "next": {
      if (state.queue.length === 0) {
        return state;
      }

      const nonExpiredQueue = state.queue.filter(
        notification =>
          (!notification.expiresAt ||
            notification.expiresAt >= new Date().getTime()) &&
          !state.cancelledIds.includes(notification.id)
      );

      let candidateIndex = 0;
      let notificationCandidate;
      const allStackable = state.active.every(
        activeNotification => activeNotification.stackable
      );
      while (
        candidateIndex < nonExpiredQueue.length &&
        !notificationCandidate
      ) {
        if (allStackable || nonExpiredQueue[candidateIndex].stackable) {
          notificationCandidate = nonExpiredQueue[candidateIndex];
        } else {
          candidateIndex += 1;
        }
      }

      if (!notificationCandidate) {
        return { ...state, queue: nonExpiredQueue };
      }

      return {
        ...state,
        active: [...state.active, notificationCandidate],
        queue: nonExpiredQueue.slice(1),
      };
    }
    case "enqueue": {
      const { stackable, forced, expiryDuration } = action.payload;
      const incomingNotification: ProcessedNotification = {
        priority: 0,
        ...action.payload,
        id: action.payload.id || v4(),
        expiresAt: expiryDuration
          ? new Date().getTime() + expiryDuration
          : undefined,
      };

      if (stackable) {
        return {
          ...state,
          active: [...state.active, incomingNotification],
        };
      }

      if (forced) {
        return {
          ...state,
          active: [incomingNotification],
        };
      }

      return {
        ...state,
        queue: [...state.queue, incomingNotification].sort((a, b) =>
          a.priority < b.priority ? 1 : a.priority === b.priority ? 0 : -1
        ),
      };
    }
  }

  return state;
};

export default reducer;
