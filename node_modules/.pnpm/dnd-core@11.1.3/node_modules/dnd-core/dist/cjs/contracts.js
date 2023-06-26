"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSourceContract = validateSourceContract;
exports.validateTargetContract = validateTargetContract;
exports.validateType = validateType;

var _invariant = require("@react-dnd/invariant");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function validateSourceContract(source) {
  (0, _invariant.invariant)(typeof source.canDrag === 'function', 'Expected canDrag to be a function.');
  (0, _invariant.invariant)(typeof source.beginDrag === 'function', 'Expected beginDrag to be a function.');
  (0, _invariant.invariant)(typeof source.endDrag === 'function', 'Expected endDrag to be a function.');
}

function validateTargetContract(target) {
  (0, _invariant.invariant)(typeof target.canDrop === 'function', 'Expected canDrop to be a function.');
  (0, _invariant.invariant)(typeof target.hover === 'function', 'Expected hover to be a function.');
  (0, _invariant.invariant)(typeof target.drop === 'function', 'Expected beginDrag to be a function.');
}

function validateType(type, allowArray) {
  if (allowArray && Array.isArray(type)) {
    type.forEach(function (t) {
      return validateType(t, false);
    });
    return;
  }

  (0, _invariant.invariant)(typeof type === 'string' || _typeof(type) === 'symbol', allowArray ? 'Type can only be a string, a symbol, or an array of either.' : 'Type can only be a string or a symbol.');
}