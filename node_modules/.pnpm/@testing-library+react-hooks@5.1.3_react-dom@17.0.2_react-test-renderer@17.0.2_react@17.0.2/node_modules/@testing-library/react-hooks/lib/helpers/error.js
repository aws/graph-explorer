"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeoutError = void 0;

class TimeoutError extends Error {
  constructor(util, timeout) {
    super(`Timed out in ${util.name} after ${timeout}ms.`);
  }

}

exports.TimeoutError = TimeoutError;