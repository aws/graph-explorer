import { useCallback, useEffect, useReducer, useRef } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import reducer, {
  initialState,
  ProcessedNotification,
  ScheduledNotification,
} from "./reducer";

const useManager = () => {
  const [state, dispatchNotification] = useReducer(reducer, initialState);
  const timeoutRefs = useRef<Record<string, ScheduledNotification>>({});

  const createTimeout = useCallback((notification: ProcessedNotification) => {
    if (
      notification.autoHideDuration !== null &&
      !Object.keys(timeoutRefs.current).includes(notification.id)
    ) {
      const timeout = setTimeout(() => {
        dispatchNotification({
          type: "clear",
          payload: notification,
        });
        delete timeoutRefs.current[notification.id];
      }, notification.autoHideDuration || 6000);

      timeoutRefs.current[notification.id] = {
        ...notification,
        timeout,
      };
    }
  }, []);

  useDeepCompareEffect(() => {
    // Every time that a new notification enters in the queue,
    // dispatch next to move it to active queue if proceed
    dispatchNotification({ type: "next" });

    // Create the timeouts for auto dismiss the notification
    state.active.forEach(notification => {
      createTimeout(notification);
    });
  }, [state.active, state.queue, createTimeout]);

  // Safely unmount
  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      Object.keys(timeouts).forEach(key => {
        timeouts[key].timeout && clearTimeout(timeouts[key].timeout);
      });
    };
  }, []);

  const cancelTimeout = useCallback((notification: ProcessedNotification) => {
    const timeout = timeoutRefs.current[notification.id]?.timeout;
    timeout && clearTimeout(timeout);
    delete timeoutRefs.current[notification.id];
  }, []);

  const resumeTimeout = useCallback(
    (notification: ProcessedNotification) => {
      if (timeoutRefs.current[notification.id]) {
        return;
      }

      createTimeout(notification);
    },
    [createTimeout]
  );

  return { state, dispatchNotification, cancelTimeout, resumeTimeout };
};

export default useManager;
