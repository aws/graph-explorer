"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanup = cleanup;
exports.addCleanup = addCleanup;
exports.removeCleanup = removeCleanup;
exports.autoRegisterCleanup = autoRegisterCleanup;
let cleanupCallbacks = [];

async function cleanup() {
  for (const callback of cleanupCallbacks) {
    await callback();
  }

  cleanupCallbacks = [];
}

function addCleanup(callback) {
  cleanupCallbacks = [callback, ...cleanupCallbacks];
  return () => removeCleanup(callback);
}

function removeCleanup(callback) {
  cleanupCallbacks = cleanupCallbacks.filter(cb => cb !== callback);
}

function autoRegisterCleanup() {
  // Automatically registers cleanup in supported testing frameworks
  if (typeof afterEach === 'function' && !process.env.RHTL_SKIP_AUTO_CLEANUP) {
    afterEach(async () => {
      await cleanup();
    });
  }
}