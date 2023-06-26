"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enableErrorOutputSuppression = enableErrorOutputSuppression;
exports.suppressErrorOutput = suppressErrorOutput;

var _filterConsole = _interopRequireDefault(require("filter-console"));

function suppressErrorOutput() {
  if (process.env.RHTL_DISABLE_ERROR_FILTERING) {
    return () => {};
  }

  return (0, _filterConsole.default)([/^The above error occurred in the <TestComponent> component:/, // error boundary output
  /^Error: Uncaught .+/ // jsdom output
  ], {
    methods: ['error']
  });
}

function enableErrorOutputSuppression() {
  // Automatically registers console error suppression and restoration in supported testing frameworks
  if (typeof beforeEach === 'function' && typeof afterEach === 'function') {
    let restoreConsole;
    beforeEach(() => {
      restoreConsole = suppressErrorOutput();
    });
    afterEach(() => restoreConsole());
  }
}