'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var dayjs = require('dayjs');
var hooks = require('@mantine/hooks');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);

function formatMonthLabel({ month, locale, format }) {
  return hooks.upperFirst(dayjs__default(month).locale(locale).format(format));
}

exports.formatMonthLabel = formatMonthLabel;
//# sourceMappingURL=format-month-label.js.map
