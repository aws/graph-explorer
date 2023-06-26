'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var getStartOfWeek = require('../get-start-of-week/get-start-of-week.js');
var getEndOfWeek = require('../get-end-of-week/get-end-of-week.js');

function getMonthDays(month, firstDayOfWeek = "monday") {
  const currentMonth = month.getMonth();
  const startOfMonth = new Date(month.getFullYear(), currentMonth, 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const endDate = getEndOfWeek.getEndOfWeek(endOfMonth, firstDayOfWeek);
  const date = getStartOfWeek.getStartOfWeek(startOfMonth, firstDayOfWeek);
  const weeks = [];
  while (date <= endDate) {
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}

exports.getMonthDays = getMonthDays;
//# sourceMappingURL=get-month-days.js.map
