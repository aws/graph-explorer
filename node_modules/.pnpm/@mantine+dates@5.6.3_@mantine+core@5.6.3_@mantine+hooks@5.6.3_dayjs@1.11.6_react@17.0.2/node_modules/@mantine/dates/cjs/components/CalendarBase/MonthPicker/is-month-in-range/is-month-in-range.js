'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dayjs = require('dayjs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);

function isMonthInRange({ date, minDate, maxDate }) {
  const hasMinDate = minDate instanceof Date;
  const hasMaxDate = maxDate instanceof Date;
  if (!hasMaxDate && !hasMinDate) {
    return true;
  }
  const endOfMonth = dayjs__default(date).endOf("month");
  const startOfMonth = dayjs__default(date).startOf("month");
  const maxInRange = hasMaxDate ? startOfMonth.isBefore(maxDate) : true;
  const minInRange = hasMinDate ? endOfMonth.isAfter(minDate) : true;
  return maxInRange && minInRange;
}

exports.isMonthInRange = isMonthInRange;
//# sourceMappingURL=is-month-in-range.js.map
