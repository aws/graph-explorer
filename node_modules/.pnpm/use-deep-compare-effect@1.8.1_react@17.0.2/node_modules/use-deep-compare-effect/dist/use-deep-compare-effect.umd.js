(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
	typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.UseDeepCompareEffect = {}, global.React));
})(this, (function (exports, React) { 'use strict';

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

	function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

	var has = Object.prototype.hasOwnProperty;

	function find(iter, tar, key) {
	  for (var _iterator = _createForOfIteratorHelperLoose(iter.keys()), _step; !(_step = _iterator()).done;) {
	    key = _step.value;
	    if (dequal(key, tar)) return key;
	  }
	}

	function dequal(foo, bar) {
	  var ctor, len, tmp;
	  if (foo === bar) return true;

	  if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
	    if (ctor === Date) return foo.getTime() === bar.getTime();
	    if (ctor === RegExp) return foo.toString() === bar.toString();

	    if (ctor === Array) {
	      if ((len = foo.length) === bar.length) {
	        while (len-- && dequal(foo[len], bar[len])) {
	        }
	      }

	      return len === -1;
	    }

	    if (ctor === Set) {
	      if (foo.size !== bar.size) {
	        return false;
	      }

	      for (var _iterator2 = _createForOfIteratorHelperLoose(foo), _step2; !(_step2 = _iterator2()).done;) {
	        len = _step2.value;
	        tmp = len;

	        if (tmp && typeof tmp === 'object') {
	          tmp = find(bar, tmp);
	          if (!tmp) return false;
	        }

	        if (!bar.has(tmp)) return false;
	      }

	      return true;
	    }

	    if (ctor === Map) {
	      if (foo.size !== bar.size) {
	        return false;
	      }

	      for (var _iterator3 = _createForOfIteratorHelperLoose(foo), _step3; !(_step3 = _iterator3()).done;) {
	        len = _step3.value;
	        tmp = len[0];

	        if (tmp && typeof tmp === 'object') {
	          tmp = find(bar, tmp);
	          if (!tmp) return false;
	        }

	        if (!dequal(len[1], bar.get(tmp))) {
	          return false;
	        }
	      }

	      return true;
	    }

	    if (ctor === ArrayBuffer) {
	      foo = new Uint8Array(foo);
	      bar = new Uint8Array(bar);
	    } else if (ctor === DataView) {
	      if ((len = foo.byteLength) === bar.byteLength) {
	        while (len-- && foo.getInt8(len) === bar.getInt8(len)) {
	        }
	      }

	      return len === -1;
	    }

	    if (ArrayBuffer.isView(foo)) {
	      if ((len = foo.byteLength) === bar.byteLength) {
	        while (len-- && foo[len] === bar[len]) {
	        }
	      }

	      return len === -1;
	    }

	    if (!ctor || typeof foo === 'object') {
	      len = 0;

	      for (ctor in foo) {
	        if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
	        if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
	      }

	      return Object.keys(bar).length === len;
	    }
	  }

	  return foo !== foo && bar !== bar;
	}

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

	  if (!dequal(value, ref.current)) {
	    ref.current = value;
	    signalRef.current += 1;
	  } // eslint-disable-next-line react-hooks/exhaustive-deps


	  return React__namespace.useMemo(function () {
	    return ref.current;
	  }, [signalRef.current]);
	}

	function useDeepCompareEffect(callback, dependencies) {
	  {
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

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=use-deep-compare-effect.umd.js.map
