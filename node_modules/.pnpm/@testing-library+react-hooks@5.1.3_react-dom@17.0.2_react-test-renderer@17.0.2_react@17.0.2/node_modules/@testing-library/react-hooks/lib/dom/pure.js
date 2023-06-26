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

function createDomRenderer(rendererProps, {
  wrapper
}) {
  const container = document.createElement('div');
  const testHarness = (0, _createTestHarness.createTestHarness)(rendererProps, wrapper);
  return {
    render(props) {
      (0, _testUtils.act)(() => {
        _reactDom.default.render(testHarness(props), container);
      });
    },

    rerender(props) {
      (0, _testUtils.act)(() => {
        _reactDom.default.render(testHarness(props), container);
      });
    },

    unmount() {
      (0, _testUtils.act)(() => {
        _reactDom.default.unmountComponentAtNode(container);
      });
    },

    act: _testUtils.act
  };
}

const renderHook = (0, _core.createRenderHook)(createDomRenderer);
exports.renderHook = renderHook;