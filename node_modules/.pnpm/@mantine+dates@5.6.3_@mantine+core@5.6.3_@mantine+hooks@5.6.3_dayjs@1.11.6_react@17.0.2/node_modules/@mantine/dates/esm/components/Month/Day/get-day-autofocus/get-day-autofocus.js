function getDayAutofocus({ hasValue, selected, firstInMonth }) {
  if (hasValue) {
    return selected ? true : void 0;
  }
  return firstInMonth ? true : void 0;
}

export { getDayAutofocus };
//# sourceMappingURL=get-day-autofocus.js.map
