"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _default = function _default(element) {
  if (!element) {
    return false;
  }

  if (element instanceof HTMLElement && element.offsetParent) {
    return true;
  }

  if (element instanceof SVGGraphicsElement && element.getBBox) {
    var _element$getBBox = element.getBBox(),
        width = _element$getBBox.width,
        height = _element$getBBox.height;

    if (width || height) {
      return true;
    }
  }

  if (element instanceof HTMLElement && element.getBoundingClientRect) {
    var _element$getBoundingC = element.getBoundingClientRect(),
        _width = _element$getBoundingC.width,
        _height = _element$getBoundingC.height;

    if (_width || _height) {
      return true;
    }
  }

  return false;
};

exports.default = _default;