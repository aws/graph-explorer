'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var Group = require('../../Group/Group.js');
var Stack = require('../../Stack/Stack.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

function InputsGroup({
  spacing,
  offset,
  orientation,
  children,
  role,
  unstyled
}) {
  if (orientation === "horizontal") {
    return /* @__PURE__ */ React__default.createElement(Group.Group, {
      pt: offset,
      spacing,
      role,
      unstyled
    }, children);
  }
  return /* @__PURE__ */ React__default.createElement(Stack.Stack, {
    pt: offset,
    spacing,
    role,
    unstyled
  }, children);
}

exports.InputsGroup = InputsGroup;
//# sourceMappingURL=InputsGroup.js.map
