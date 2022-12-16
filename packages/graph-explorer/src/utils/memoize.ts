import isObject from "lodash/isObject";

/**
 * A better version of lodash memoize
 * https://lodash.com/docs#memoize
 * This version does a better job of garbage collecting old values
 * @param func the function to be memoized
 * @returns {Function}
 */
export default function memoize<T extends (...args: any[]) => void>(
  func: T
): T {
  // used to map scalar argument values to objects we can use as a key in WeakMap.
  const root: any = {
    scalars: new Map(),
    objects: new WeakMap(),
  };

  function memoizedFunction(...args: unknown[]) {
    // walk the arguments and retrieve the nested maps until we get to the final argument,
    // whose map will hold the results
    const stop = args.length;
    let current = root;
    for (let i = 0; i < stop; ++i) {
      const arg = args[i];
      // use the WeakMap if the argument is an object.
      const map: any = isObject(arg) ? current.objects : current.scalars;
      if (map.has(arg)) {
        current = map.get(arg);
      } else {
        // we have not seen this argument before.  Create a new container
        // for it, and store it in the map before returning it.
        current = {
          scalars: new Map(),
          objects: new WeakMap(),
        };
        map.set(arg, current);
      }
    }

    // see if we have an answer already
    if (current.result) {
      return current.result.value;
    }

    // nope...
    current.result = { value: func(...args) };
    return current.result.value;
  }

  return (memoizedFunction as unknown) as T;
}
