import dayjs from 'dayjs';

function isDisabled({
  minDate,
  maxDate,
  excludeDate,
  disableOutsideEvents,
  date,
  outside
}) {
  const isAfterMax = maxDate instanceof Date && dayjs(maxDate).isBefore(date, "day");
  const isBeforeMin = minDate instanceof Date && dayjs(minDate).isAfter(date, "day");
  const shouldExclude = typeof excludeDate === "function" && excludeDate(date);
  const disabledOutside = !!disableOutsideEvents && !!outside;
  return isAfterMax || isBeforeMin || shouldExclude || disabledOutside;
}

export { isDisabled };
//# sourceMappingURL=is-disabled.js.map
