'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getDayAutofocus({ hasValue, selected, firstInMonth }) {
  if (hasValue) {
    return selected ? true : void 0;
  }
  return firstInMonth ? true : void 0;
}

exports.getDayAutofocus = getDayAutofocus;
//# sourceMappingURL=get-day-autofocus.js.map
