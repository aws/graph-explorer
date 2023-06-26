import dayjs from 'dayjs';

function isMonthInRange({ date, minDate, maxDate }) {
  const hasMinDate = minDate instanceof Date;
  const hasMaxDate = maxDate instanceof Date;
  if (!hasMaxDate && !hasMinDate) {
    return true;
  }
  const endOfMonth = dayjs(date).endOf("month");
  const startOfMonth = dayjs(date).startOf("month");
  const maxInRange = hasMaxDate ? startOfMonth.isBefore(maxDate) : true;
  const minInRange = hasMinDate ? endOfMonth.isAfter(minDate) : true;
  return maxInRange && minInRange;
}

export { isMonthInRange };
//# sourceMappingURL=is-month-in-range.js.map
