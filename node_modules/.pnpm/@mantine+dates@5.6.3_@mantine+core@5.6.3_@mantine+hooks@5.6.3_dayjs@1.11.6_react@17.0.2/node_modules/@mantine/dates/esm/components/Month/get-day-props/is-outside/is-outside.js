import 'dayjs';
import { isSameMonth } from '../../../../utils/is-same-month/is-same-month.js';

function isOutside(date, month) {
  return !isSameMonth(date, month);
}

export { isOutside };
//# sourceMappingURL=is-outside.js.map
