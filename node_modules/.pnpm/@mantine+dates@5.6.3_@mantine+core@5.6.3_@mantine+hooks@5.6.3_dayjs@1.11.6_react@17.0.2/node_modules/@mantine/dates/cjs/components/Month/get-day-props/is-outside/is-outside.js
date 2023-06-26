'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('dayjs');
var isSameMonth = require('../../../../utils/is-same-month/is-same-month.js');

function isOutside(date, month) {
  return !isSameMonth.isSameMonth(date, month);
}

exports.isOutside = isOutside;
//# sourceMappingURL=is-outside.js.map
