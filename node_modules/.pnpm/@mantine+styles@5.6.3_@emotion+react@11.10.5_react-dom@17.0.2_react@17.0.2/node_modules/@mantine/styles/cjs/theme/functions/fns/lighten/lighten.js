'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var toRgba = require('../../../utils/to-rgba/to-rgba.js');

function lighten(color, alpha) {
  const { r, g, b, a } = toRgba.toRgba(color);
  const light = (input) => Math.round(input + (255 - input) * alpha);
  return `rgba(${light(r)}, ${light(g)}, ${light(b)}, ${a})`;
}

exports.lighten = lighten;
//# sourceMappingURL=lighten.js.map
