'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var hooks = require('@mantine/hooks');
var MachineNumber_styles = require('./MachineNumber.styles.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e['default'] : e; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

const MachineNumber = React.forwardRef((props, ref) => {
  const [oldNumber, setOldNumber] = React.useState(props.value);
  const [newNumber, setNewNumber] = React.useState(props.value);
  const [scrollAnimationDirection, setScrollAnimationDirection] = React.useState("up");
  const [isActive, setIsActive] = React.useState(false);
  const prevValueRef = hooks.usePrevious(props.value);
  const scrollByDir = (dir) => {
    setIsActive(true);
    setScrollAnimationDirection(dir);
    setTimeout(() => {
      setIsActive(false);
    }, 180);
  };
  const scroll = () => {
    const { newOriginalNumber, oldOriginalNumber } = props;
    if (newOriginalNumber == null || oldOriginalNumber == null) {
      return;
    }
    if (newOriginalNumber > oldOriginalNumber) {
      scrollByDir("up");
    } else if (newOriginalNumber < oldOriginalNumber) {
      scrollByDir("down");
    }
  };
  React.useEffect(() => {
    setOldNumber(prevValueRef);
    setNewNumber(props.value);
    scroll();
  }, [props.value, prevValueRef]);
  const { classes, cx } = MachineNumber_styles['default'](null, { name: "MachineNumber" });
  const newNumberScrollAnimationClass = React.useMemo(() => isActive ? scrollAnimationDirection === "up" ? classes.currentNumberScrollUp : classes.currentNumberScrollDown : null, [isActive, scrollAnimationDirection]);
  const oldNumberScrollAnimationClass = React.useMemo(() => isActive ? scrollAnimationDirection === "up" ? classes.oldNumberScrollUp : classes.oldNumberScrollDown : null, [isActive, scrollAnimationDirection]);
  return /* @__PURE__ */ React__default.createElement("span", {
    ref,
    className: classes.baseNumber
  }, oldNumber && /* @__PURE__ */ React__default.createElement("span", {
    className: cx(classes.oldNumber, classes.currentNumberTop, oldNumberScrollAnimationClass)
  }, oldNumber) || null, /* @__PURE__ */ React__default.createElement("span", null, /* @__PURE__ */ React__default.createElement("span", {
    className: cx(classes.currentNumber, newNumberScrollAnimationClass)
  }, newNumber)), oldNumber && /* @__PURE__ */ React__default.createElement("span", {
    className: cx(classes.oldNumber, classes.oldNumberBottom, oldNumberScrollAnimationClass)
  }, oldNumber) || null);
});

exports.MachineNumber = MachineNumber;
//# sourceMappingURL=MachineNumber.js.map
