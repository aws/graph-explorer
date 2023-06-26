'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var dequal = require('dequal');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);

function checkDeps(deps) {
  if (!deps || !deps.length) {
    throw new Error('useDeepCompareEffect should not be used with no dependencies. Use React.useEffect instead.');
  }

  if (deps.every(isPrimitive)) {
    throw new Error('useDeepCompareEffect should not be used with dependencies that are all primitive values. Use React.useEffect instead.');
  }
}

function isPrimitive(val) {
  return val == null || /^[sbn]/.test(typeof val);
}
/**
 * @param value the value to be memoized (usually a dependency list)
 * @returns a momoized version of the value as long as it remains deeply equal
 */


function useDeepCompareMemoize(value) {
  var ref = React__namespace.useRef(value);
  var signalRef = React__namespace.useRef(0);

  if (!dequal.dequal(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  } // eslint-disable-next-line react-hooks/exhaustive-deps


  return React__namespace.useMemo(function () {
    return ref.current;
  }, [signalRef.current]);
}

function useDeepCompareEffect(callback, dependencies) {
  if (process.env.NODE_ENV !== 'production') {
    checkDeps(dependencies);
  } // eslint-disable-next-line react-hooks/exhaustive-deps


  return React__namespace.useEffect(callback, useDeepCompareMemoize(dependencies));
}

function useDeepCompareEffectNoCheck(callback, dependencies) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React__namespace.useEffect(callback, useDeepCompareMemoize(dependencies));
}

exports["default"] = useDeepCompareEffect;
exports.useDeepCompareEffectNoCheck = useDeepCompareEffectNoCheck;
exports.useDeepCompareMemoize = useDeepCompareMemoize;
