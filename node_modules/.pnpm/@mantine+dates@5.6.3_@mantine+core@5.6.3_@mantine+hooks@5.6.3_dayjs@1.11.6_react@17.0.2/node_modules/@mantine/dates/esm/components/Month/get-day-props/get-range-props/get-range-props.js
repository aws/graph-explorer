import dayjs from 'dayjs';
import { isSameDate } from '../../../../utils/is-same-date/is-same-date.js';

function getRangeProps(date, range) {
  const hasRange = Array.isArray(range) && range.every((val) => val instanceof Date);
  const inclusiveRange = hasRange && [
    dayjs(range[0]).subtract(1, "day"),
    dayjs(range[1]).add(1, "day")
  ];
  const firstInRange = hasRange && isSameDate(date, range[0]);
  const lastInRange = hasRange && isSameDate(date, range[1]);
  const inRange = hasRange && dayjs(date).isAfter(inclusiveRange[0], "day") && dayjs(date).isBefore(inclusiveRange[1], "day");
  return { firstInRange, lastInRange, inRange, selectedInRange: firstInRange || lastInRange };
}

export { getRangeProps };
//# sourceMappingURL=get-range-props.js.map
