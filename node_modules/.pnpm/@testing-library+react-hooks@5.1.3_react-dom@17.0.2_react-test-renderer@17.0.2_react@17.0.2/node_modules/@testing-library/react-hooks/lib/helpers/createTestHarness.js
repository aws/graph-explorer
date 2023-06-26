"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTestHarness = createTestHarness;

var _react = _interopRequireWildcard(require("react"));

var _reactErrorBoundary = require("react-error-boundary");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function createTestHarness({
  callback,
  setValue,
  setError
}, Wrapper, suspense = true) {
  const TestComponent = ({
    hookProps
  }) => {
    // coerce undefined into TProps, so it maintains the previous behaviour
    setValue(callback(hookProps));
    return null;
  };

  let resetErrorBoundary = () => {};

  const ErrorFallback = ({
    error,
    resetErrorBoundary: reset
  }) => {
    resetErrorBoundary = () => {
      resetErrorBoundary = () => {};

      reset();
    };

    setError(error);
    return null;
  };

  const testHarness = props => {
    resetErrorBoundary();

    let component = /*#__PURE__*/_react.default.createElement(TestComponent, {
      hookProps: props
    });

    if (Wrapper) {
      component = /*#__PURE__*/_react.default.createElement(Wrapper, props, component);
    }

    if (suspense) {
      component = /*#__PURE__*/_react.default.createElement(_react.Suspense, {
        fallback: null
      }, component);
    }

    return /*#__PURE__*/_react.default.createElement(_reactErrorBoundary.ErrorBoundary, {
      FallbackComponent: ErrorFallback
    }, component);
  };

  return testHarness;
}