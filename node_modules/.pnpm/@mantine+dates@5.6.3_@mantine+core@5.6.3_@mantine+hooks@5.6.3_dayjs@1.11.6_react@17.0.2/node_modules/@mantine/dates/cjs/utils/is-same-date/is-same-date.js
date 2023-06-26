'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var isSameMonth = require('../is-same-month/is-same-month.js');

function isSameDate(date, comparison) {
  return isSameMonth.isSameMonth(date, comparison) && date.getDate() === comparison.getDate();
}

exports.isSameDate = isSameDate;
//# sourceMappingURL=is-same-date.js.map
