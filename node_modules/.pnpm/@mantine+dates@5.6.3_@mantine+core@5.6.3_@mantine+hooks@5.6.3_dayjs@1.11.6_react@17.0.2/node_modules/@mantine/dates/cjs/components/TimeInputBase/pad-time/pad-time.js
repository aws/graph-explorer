'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function padTime(value) {
  const _val = parseInt(value, 10);
  return _val >= 10 ? _val.toString() : `0${_val}`;
}

exports.padTime = padTime;
//# sourceMappingURL=pad-time.js.map
