import { useContext } from "react";
import {
  NotificationContext,
  NotificationContextValue,
} from "./NotificationProvider";

export default function useNotification(): NotificationContextValue {
  return useContext(NotificationContext);
}
