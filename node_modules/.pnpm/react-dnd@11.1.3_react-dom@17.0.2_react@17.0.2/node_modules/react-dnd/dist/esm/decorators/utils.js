export function getDecoratedComponent(instanceRef) {
  var currentRef = instanceRef.current;

  if (currentRef == null) {
    return null;
  } else if (currentRef.decoratedRef) {
    // go through the private field in decorateHandler to avoid the invariant hit
    return currentRef.decoratedRef.current;
  } else {
    return currentRef;
  }
}
export function isClassComponent(Component) {
  return Component && Component.prototype && typeof Component.prototype.render === 'function';
}
export function isRefForwardingComponent(C) {
  var _item$$$typeof;

  var item = C;
  return (item === null || item === void 0 ? void 0 : (_item$$$typeof = item.$$typeof) === null || _item$$$typeof === void 0 ? void 0 : _item$$$typeof.toString()) === 'Symbol(react.forward_ref)';
}
export function isRefable(C) {
  return isClassComponent(C) || isRefForwardingComponent(C);
}
export function checkDecoratorArguments(functionName, signature) {
  if (process.env.NODE_ENV !== 'production') {
    for (var i = 0; i < (arguments.length <= 2 ? 0 : arguments.length - 2); i++) {
      var arg = i + 2 < 2 || arguments.length <= i + 2 ? undefined : arguments[i + 2];

      if (arg && arg.prototype && arg.prototype.render) {
        // eslint-disable-next-line no-console
        console.error('You seem to be applying the arguments in the wrong order. ' + "It should be ".concat(functionName, "(").concat(signature, ")(Component), not the other way around. ") + 'Read more: http://react-dnd.github.io/react-dnd/docs/troubleshooting#you-seem-to-be-applying-the-arguments-in-the-wrong-order');
        return;
      }
    }
  }
}