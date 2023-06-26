import dayjs from 'dayjs';

function getMonthsNames(locale, format = "MMM") {
  const names = [];
  const date = new Date(2021, 0, 1);
  for (let i = 0; i < 12; i += 1) {
    names.push(dayjs(date).locale(locale).format(format));
    date.setMonth(date.getMonth() + 1);
  }
  return names;
}

export { getMonthsNames };
//# sourceMappingURL=get-months-names.js.map
