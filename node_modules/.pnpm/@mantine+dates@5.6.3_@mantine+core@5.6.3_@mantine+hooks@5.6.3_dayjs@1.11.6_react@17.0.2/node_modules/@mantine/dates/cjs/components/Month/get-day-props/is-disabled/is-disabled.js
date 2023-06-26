'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dayjs = require('dayjs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);

function isDisabled({
  minDate,
  maxDate,
  excludeDate,
  disableOutsideEvents,
  date,
  outside
}) {
  const isAfterMax = maxDate instanceof Date && dayjs__default(maxDate).isBefore(date, "day");
  const isBeforeMin = minDate instanceof Date && dayjs__default(minDate).isAfter(date, "day");
  const shouldExclude = typeof excludeDate === "function" && excludeDate(date);
  const disabledOutside = !!disableOutsideEvents && !!outside;
  return isAfterMax || isBeforeMin || shouldExclude || disabledOutside;
}

exports.isDisabled = isDisabled;
//# sourceMappingURL=is-disabled.js.map
