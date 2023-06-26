'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function isMarkFilled({ mark, offset, value }) {
  return typeof offset === "number" ? mark.value >= offset && mark.value <= value : mark.value <= value;
}

exports.isMarkFilled = isMarkFilled;
//# sourceMappingURL=is-mark-filled.js.map
