import { formatDistance } from "date-fns/formatDistance";

export function formatRelativeDate(date: Date) {
  return formatDistance(date, new Date(), { addSuffix: true });
}
