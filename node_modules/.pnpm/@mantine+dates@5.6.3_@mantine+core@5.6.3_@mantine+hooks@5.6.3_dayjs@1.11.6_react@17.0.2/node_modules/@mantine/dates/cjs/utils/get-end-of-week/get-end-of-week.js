'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getEndOfWeek(date, firstDayOfWeek = "monday") {
  const value = new Date(date);
  const day = value.getDay();
  const isSunday = firstDayOfWeek === "sunday";
  const clampToLastDay = 7 - (isSunday ? day + 1 : day);
  if (isSunday && day !== 6 || day !== 0) {
    value.setDate(value.getDate() + clampToLastDay);
  }
  return value;
}

exports.getEndOfWeek = getEndOfWeek;
//# sourceMappingURL=get-end-of-week.js.map
