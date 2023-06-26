'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getStartOfWeek(date, firstDayOfWeek = "monday") {
  const value = new Date(date);
  const day = value.getDay() || 7;
  const isSunday = firstDayOfWeek === "sunday";
  const clampToFirstDay = isSunday ? day : day - 1;
  if (isSunday && day !== 0 || day !== 1) {
    value.setHours(-24 * clampToFirstDay);
  }
  return value;
}

exports.getStartOfWeek = getStartOfWeek;
//# sourceMappingURL=get-start-of-week.js.map
