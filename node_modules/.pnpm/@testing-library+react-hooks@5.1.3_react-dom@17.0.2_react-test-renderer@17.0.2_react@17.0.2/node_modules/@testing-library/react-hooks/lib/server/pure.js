"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  renderHook: true,
  act: true,
  cleanup: true,
  addCleanup: true,
  removeCleanup: true,
  suppressErrorOutput: true
};
Object.defineProperty(exports, "act", {
  enumerable: true,
  get: function () {
    return _testUtils.act;
  }
});
Object.defineProperty(exports, "cleanup", {
  enumerable: true,
  get: function () {
    return _core.cleanup;
  }
});
Object.defineProperty(exports, "addCleanup", {
  enumerable: true,
  get: function () {
    return _core.addCleanup;
  }
});
Object.defineProperty(exports, "removeCleanup", {
  enumerable: true,
  get: function () {
    return _core.removeCleanup;
  }
});
Object.defineProperty(exports, "suppressErrorOutput", {
  enumerable: true,
  get: function () {
    return _core.suppressErrorOutput;
  }
});
exports.renderHook = void 0;

var _server = _interopRequireDefault(require("react-dom/server"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _testUtils = require("react-dom/test-utils");

var _core = require("../core");

var _createTestHarness = require("../helpers/createTestHarness");

var _react = require("../types/react");

Object.keys(_react).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _react[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _react[key];
    }
  });
});

function createServerRenderer(rendererProps, {
  wrapper
}) {
  let renderProps;
  let container;
  let serverOutput = '';
  const testHarness = (0, _createTestHarness.createTestHarness)(rendererProps, wrapper, false);
  return {
    render(props) {
      renderProps = props;
      (0, _testUtils.act)(() => {
        try {
          serverOutput = _server.default.renderToString(testHarness(props));
        } catch (e) {
          rendererProps.setError(e);
        }
      });
    },

    hydrate() {
      if (container) {
        throw new Error('The component can only be hydrated once');
      } else {
        container = document.createElement('div');
        container.innerHTML = serverOutput;
        (0, _testUtils.act)(() => {
          _reactDom.default.hydrate(testHarness(renderProps), container);
        });
      }
    },

    rerender(props) {
      if (!container) {
        throw new Error('You must hydrate the component before you can rerender');
      }

      (0, _testUtils.act)(() => {
        _reactDom.default.render(testHarness(props), container);
      });
    },

    unmount() {
      if (container) {
        (0, _testUtils.act)(() => {
          _reactDom.default.unmountComponentAtNode(container);
        });
      }
    },

    act: _testUtils.act
  };
}

const renderHook = (0, _core.createRenderHook)(createServerRenderer);
exports.renderHook = renderHook;