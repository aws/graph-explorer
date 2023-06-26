"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cleanup = require("../core/cleanup");

var _console = require("../core/console");

var _pure = require("./pure");

Object.keys(_pure).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _pure[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _pure[key];
    }
  });
});
(0, _cleanup.autoRegisterCleanup)();
(0, _console.enableErrorOutputSuppression)();