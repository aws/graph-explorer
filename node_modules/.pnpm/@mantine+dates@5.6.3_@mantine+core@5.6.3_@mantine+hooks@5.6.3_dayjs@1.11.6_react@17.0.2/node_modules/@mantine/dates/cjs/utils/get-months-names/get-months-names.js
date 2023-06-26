'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dayjs = require('dayjs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);

function getMonthsNames(locale, format = "MMM") {
  const names = [];
  const date = new Date(2021, 0, 1);
  for (let i = 0; i < 12; i += 1) {
    names.push(dayjs__default(date).locale(locale).format(format));
    date.setMonth(date.getMonth() + 1);
  }
  return names;
}

exports.getMonthsNames = getMonthsNames;
//# sourceMappingURL=get-months-names.js.map
