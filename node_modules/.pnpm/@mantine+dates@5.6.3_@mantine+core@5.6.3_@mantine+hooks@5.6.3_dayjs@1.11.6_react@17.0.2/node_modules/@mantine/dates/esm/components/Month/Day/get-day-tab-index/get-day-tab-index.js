function getDayTabIndex({ focusable, hasValue, selected, firstInMonth }) {
  if (!focusable) {
    return -1;
  }
  if (hasValue) {
    return selected ? 0 : -1;
  }
  return firstInMonth ? 0 : -1;
}

export { getDayTabIndex };
//# sourceMappingURL=get-day-tab-index.js.map
