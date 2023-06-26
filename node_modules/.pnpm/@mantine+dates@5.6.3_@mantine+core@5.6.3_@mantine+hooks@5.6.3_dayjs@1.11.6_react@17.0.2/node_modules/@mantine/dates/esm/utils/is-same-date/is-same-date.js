import { isSameMonth } from '../is-same-month/is-same-month.js';

function isSameDate(date, comparison) {
  return isSameMonth(date, comparison) && date.getDate() === comparison.getDate();
}

export { isSameDate };
//# sourceMappingURL=is-same-date.js.map
