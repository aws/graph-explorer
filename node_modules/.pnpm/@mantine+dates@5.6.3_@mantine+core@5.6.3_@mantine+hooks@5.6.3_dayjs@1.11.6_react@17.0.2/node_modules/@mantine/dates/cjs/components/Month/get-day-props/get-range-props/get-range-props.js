'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dayjs = require('dayjs');
var isSameDate = require('../../../../utils/is-same-date/is-same-date.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);

function getRangeProps(date, range) {
  const hasRange = Array.isArray(range) && range.every((val) => val instanceof Date);
  const inclusiveRange = hasRange && [
    dayjs__default(range[0]).subtract(1, "day"),
    dayjs__default(range[1]).add(1, "day")
  ];
  const firstInRange = hasRange && isSameDate.isSameDate(date, range[0]);
  const lastInRange = hasRange && isSameDate.isSameDate(date, range[1]);
  const inRange = hasRange && dayjs__default(date).isAfter(inclusiveRange[0], "day") && dayjs__default(date).isBefore(inclusiveRange[1], "day");
  return { firstInRange, lastInRange, inRange, selectedInRange: firstInRange || lastInRange };
}

exports.getRangeProps = getRangeProps;
//# sourceMappingURL=get-range-props.js.map
