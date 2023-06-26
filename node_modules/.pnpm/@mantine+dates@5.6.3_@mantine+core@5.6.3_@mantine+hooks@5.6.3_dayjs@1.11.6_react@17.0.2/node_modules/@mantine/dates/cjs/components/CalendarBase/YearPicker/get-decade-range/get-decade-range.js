'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getDecadeRange(year) {
  const rounded = year - year % 10 - 1;
  const range = [];
  for (let i = 0; i < 12; i += 1) {
    const rangeYear = rounded + i;
    range.push(rangeYear);
  }
  return range;
}

exports.getDecadeRange = getDecadeRange;
//# sourceMappingURL=get-decade-range.js.map
