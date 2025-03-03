import { formatDistance } from "date-fns";

export function formatRelativeDate(date: Date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}
