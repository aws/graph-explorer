'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var hooks = require('@mantine/hooks');
var MachineNumber = require('./MachineNumber.js');
var Machine_styles = require('./Machine.styles.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

const Machine = React.forwardRef(({ value = 0, max }, ref) => {
  const [oldValue, setOldValue] = React.useState();
  const [newValue, setNewValue] = React.useState();
  const prevValueRef = hooks.usePrevious(value);
  React.useEffect(() => {
    if (typeof value === "string") {
      setOldValue(void 0);
      setNewValue(void 0);
    } else if (typeof prevValueRef === "string") {
      setOldValue(void 0);
      setNewValue(value);
    } else {
      setOldValue(prevValueRef);
      setNewValue(value);
    }
  }, [value, prevValueRef]);
  const numbers = React.useMemo(() => {
    if (typeof value === "string") {
      return [];
    }
    if (value < 1) {
      return [0];
    }
    const result = [];
    let currentValue = value;
    if (typeof max === "number") {
      currentValue = Math.min(max, currentValue);
    }
    while (currentValue >= 1) {
      result.push(currentValue % 10);
      currentValue /= 10;
      currentValue = Math.floor(currentValue);
    }
    result.reverse();
    return result;
  }, [value, max]);
  const { classes } = Machine_styles['default'](null, { name: "machine" });
  return typeof value === "string" ? /* @__PURE__ */ React__default.createElement("span", {
    ref
  }, value) : /* @__PURE__ */ React__default.createElement("span", {
    ref,
    className: classes.base
  }, numbers.map((number, i) => /* @__PURE__ */ React__default.createElement(MachineNumber.MachineNumber, {
    key: numbers.length - i - 1,
    value: number,
    oldOriginalNumber: oldValue,
    newOriginalNumber: newValue
  })), typeof max === "number" && value > max && /* @__PURE__ */ React__default.createElement("span", null, "+"));
});

exports.Machine = Machine;
//# sourceMappingURL=Machine.js.map
