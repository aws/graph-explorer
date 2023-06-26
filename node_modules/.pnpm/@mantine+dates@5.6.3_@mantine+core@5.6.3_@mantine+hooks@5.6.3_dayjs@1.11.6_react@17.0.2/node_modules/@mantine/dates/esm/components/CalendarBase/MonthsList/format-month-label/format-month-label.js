import dayjs from 'dayjs';
import { upperFirst } from '@mantine/hooks';

function formatMonthLabel({ month, locale, format }) {
  return upperFirst(dayjs(month).locale(locale).format(format));
}

export { formatMonthLabel };
//# sourceMappingURL=format-month-label.js.map
