export function shallowEqual<T>(
  objA: T,
  objB: T,
  compare?: (a: T, b: T, key?: string) => boolean | void,
  compareContext?: any
) {
  var compareResult = compare
    ? compare.call(compareContext, objA, objB)
    : void 0;
  if (compareResult !== void 0) {
    return !!compareResult;
  }

  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || !objA || typeof objB !== 'object' || !objB) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);

  // Test for A's keys different from B.
  for (var idx = 0; idx < keysA.length; idx++) {
    var key = keysA[idx];

    if (!bHasOwnProperty(key)) {
      return false;
    }

    var valueA = (objA as any)[key];
    var valueB = (objB as any)[key];

    compareResult = compare
      ? compare.call(compareContext, valueA, valueB, key)
      : void 0;

    if (
      compareResult === false ||
      (compareResult === void 0 && valueA !== valueB)
    ) {
      return false;
    }
  }

  return true;
}
