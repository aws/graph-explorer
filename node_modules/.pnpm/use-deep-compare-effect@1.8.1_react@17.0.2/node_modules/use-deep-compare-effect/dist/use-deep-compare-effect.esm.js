import * as React from 'react';
import { dequal } from 'dequal';

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
  var ref = React.useRef(value);
  var signalRef = React.useRef(0);

  if (!dequal(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  } // eslint-disable-next-line react-hooks/exhaustive-deps


  return React.useMemo(function () {
    return ref.current;
  }, [signalRef.current]);
}

function useDeepCompareEffect(callback, dependencies) {
  if (process.env.NODE_ENV !== 'production') {
    checkDeps(dependencies);
  } // eslint-disable-next-line react-hooks/exhaustive-deps


  return React.useEffect(callback, useDeepCompareMemoize(dependencies));
}

function useDeepCompareEffectNoCheck(callback, dependencies) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useEffect(callback, useDeepCompareMemoize(dependencies));
}

export { useDeepCompareEffect as default, useDeepCompareEffectNoCheck, useDeepCompareMemoize };
