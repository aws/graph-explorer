import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import { useRef } from 'react';
import raf from "rc-util/es/raf";
import useState from "rc-util/es/hooks/useState";
/**
 * State generate. Return a `setState` but it will flush all state with one render to save perf.
 * This is not a realization of `unstable_batchedUpdates`.
 */

export function useBatchFrameState() {
  var _useState = useState({}),
      _useState2 = _slicedToArray(_useState, 2),
      forceUpdate = _useState2[1];

  var statesRef = useRef([]);
  var walkingIndex = 0;
  var beforeFrameId = 0;

  function createState(defaultValue) {
    var myIndex = walkingIndex;
    walkingIndex += 1; // Fill value if not exist yet

    if (statesRef.current.length < myIndex + 1) {
      statesRef.current[myIndex] = defaultValue;
    } // Return filled as `setState`


    var value = statesRef.current[myIndex];

    function setValue(val) {
      statesRef.current[myIndex] = typeof val === 'function' ? val(statesRef.current[myIndex]) : val;
      raf.cancel(beforeFrameId); // Flush with batch

      beforeFrameId = raf(function () {
        forceUpdate({}, true);
      });
    }

    return [value, setValue];
  }

  return createState;
}