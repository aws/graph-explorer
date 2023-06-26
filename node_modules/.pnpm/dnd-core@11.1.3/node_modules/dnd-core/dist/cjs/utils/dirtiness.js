"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.areDirty = areDirty;
exports.ALL = exports.NONE = void 0;

var _js_utils = require("./js_utils");

var NONE = [];
exports.NONE = NONE;
var ALL = [];
exports.ALL = ALL;
NONE.__IS_NONE__ = true;
ALL.__IS_ALL__ = true;
/**
 * Determines if the given handler IDs are dirty or not.
 *
 * @param dirtyIds The set of dirty handler ids
 * @param handlerIds The set of handler ids to check
 */

function areDirty(dirtyIds, handlerIds) {
  if (dirtyIds === NONE) {
    return false;
  }

  if (dirtyIds === ALL || typeof handlerIds === 'undefined') {
    return true;
  }

  var commonIds = (0, _js_utils.intersection)(handlerIds, dirtyIds);
  return commonIds.length > 0;
}