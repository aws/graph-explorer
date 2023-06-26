'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getYearsRange(range) {
  const years = [];
  for (let year = range.from; year <= range.to; year += 1) {
    years.push(year);
  }
  return years;
}

exports.getYearsRange = getYearsRange;
//# sourceMappingURL=get-years-range.js.map
