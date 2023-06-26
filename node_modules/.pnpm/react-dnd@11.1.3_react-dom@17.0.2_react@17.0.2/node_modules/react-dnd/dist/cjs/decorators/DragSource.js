"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DragSource = DragSource;

var _invariant = require("@react-dnd/invariant");

var _js_utils = require("../utils/js_utils");

var _utils = require("./utils");

var _decorateHandler = require("./decorateHandler");

var _registration = require("../common/registration");

var _DragSourceMonitorImpl = require("../common/DragSourceMonitorImpl");

var _SourceConnector = require("../common/SourceConnector");

var _isValidType = require("../utils/isValidType");

var _createSourceFactory = require("./createSourceFactory");

/**
 * Decorates a component as a dragsource
 * @param type The dragsource type
 * @param spec The drag source specification
 * @param collect The props collector function
 * @param options DnD options
 */
function DragSource(type, spec, collect) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  (0, _utils.checkDecoratorArguments)('DragSource', 'type, spec, collect[, options]', type, spec, collect, options);
  var getType = type;

  if (typeof type !== 'function') {
    (0, _invariant.invariant)((0, _isValidType.isValidType)(type), 'Expected "type" provided as the first argument to DragSource to be ' + 'a string, or a function that returns a string given the current props. ' + 'Instead, received %s. ' + 'Read more: http://react-dnd.github.io/react-dnd/docs/api/drag-source', type);

    getType = function getType() {
      return type;
    };
  }

  (0, _invariant.invariant)((0, _js_utils.isPlainObject)(spec), 'Expected "spec" provided as the second argument to DragSource to be ' + 'a plain object. Instead, received %s. ' + 'Read more: http://react-dnd.github.io/react-dnd/docs/api/drag-source', spec);
  var createSource = (0, _createSourceFactory.createSourceFactory)(spec);
  (0, _invariant.invariant)(typeof collect === 'function', 'Expected "collect" provided as the third argument to DragSource to be ' + 'a function that returns a plain object of props to inject. ' + 'Instead, received %s. ' + 'Read more: http://react-dnd.github.io/react-dnd/docs/api/drag-source', collect);
  (0, _invariant.invariant)((0, _js_utils.isPlainObject)(options), 'Expected "options" provided as the fourth argument to DragSource to be ' + 'a plain object when specified. ' + 'Instead, received %s. ' + 'Read more: http://react-dnd.github.io/react-dnd/docs/api/drag-source', collect);
  return function decorateSource(DecoratedComponent) {
    return (0, _decorateHandler.decorateHandler)({
      containerDisplayName: 'DragSource',
      createHandler: createSource,
      registerHandler: _registration.registerSource,
      createConnector: function createConnector(backend) {
        return new _SourceConnector.SourceConnector(backend);
      },
      createMonitor: function createMonitor(manager) {
        return new _DragSourceMonitorImpl.DragSourceMonitorImpl(manager);
      },
      DecoratedComponent: DecoratedComponent,
      getType: getType,
      collect: collect,
      options: options
    });
  };
}