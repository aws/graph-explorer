"use strict";

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
exports.suppressErrorOutput = exports.removeCleanup = exports.addCleanup = exports.cleanup = exports.act = exports.renderHook = void 0;

var _react = require("./types/react");

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
const renderers = [{
  required: 'react-test-renderer',
  renderer: './native/pure'
}, {
  required: 'react-dom',
  renderer: './dom/pure'
}];

function hasDependency(name) {
  try {
    require(name);

    return true;
  } catch (error) {
    return false;
  }
}

function getRenderer() {
  const validRenderer = renderers.find(({
    required
  }) => hasDependency(required));

  if (validRenderer) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(validRenderer.renderer);
  } else {
    const options = renderers.map(({
      required
    }) => `  - ${required}`).sort((a, b) => a.localeCompare(b)).join('\n');
    throw new Error(`Could not auto-detect a React renderer. Are you sure you've installed one of the following\n${options}\nIf you are using a bundler, please update your imports to use a specific renderer.\nFor instructions see: https://react-hooks-testing-library.com/installation#being-specific`);
  }
}

const {
  renderHook,
  act,
  cleanup,
  addCleanup,
  removeCleanup,
  suppressErrorOutput
} = getRenderer();
exports.suppressErrorOutput = suppressErrorOutput;
exports.removeCleanup = removeCleanup;
exports.addCleanup = addCleanup;
exports.cleanup = cleanup;
exports.act = act;
exports.renderHook = renderHook;