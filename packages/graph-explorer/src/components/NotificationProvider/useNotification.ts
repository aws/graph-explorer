import { useContext } from "react";
import {
  NotificationContext,
  type NotificationContextValue,
} from "./NotificationProvider";

export default function useNotification(): NotificationContextValue {
  return useContext(NotificationContext);
}
