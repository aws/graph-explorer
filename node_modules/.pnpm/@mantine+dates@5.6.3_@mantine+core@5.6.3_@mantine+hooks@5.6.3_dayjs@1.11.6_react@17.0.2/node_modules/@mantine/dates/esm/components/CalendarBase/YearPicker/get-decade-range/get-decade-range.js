function getDecadeRange(year) {
  const rounded = year - year % 10 - 1;
  const range = [];
  for (let i = 0; i < 12; i += 1) {
    const rangeYear = rounded + i;
    range.push(rangeYear);
  }
  return range;
}

export { getDecadeRange };
//# sourceMappingURL=get-decade-range.js.map
