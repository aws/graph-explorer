"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reduce = reduce;

var _dragDrop = require("../actions/dragDrop");

var _registry = require("../actions/registry");

var _equality = require("../utils/equality");

var _dirtiness = require("../utils/dirtiness");

var _js_utils = require("../utils/js_utils");

function reduce() {
  var _state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _dirtiness.NONE;

  var action = arguments.length > 1 ? arguments[1] : undefined;

  switch (action.type) {
    case _dragDrop.HOVER:
      break;

    case _registry.ADD_SOURCE:
    case _registry.ADD_TARGET:
    case _registry.REMOVE_TARGET:
    case _registry.REMOVE_SOURCE:
      return _dirtiness.NONE;

    case _dragDrop.BEGIN_DRAG:
    case _dragDrop.PUBLISH_DRAG_SOURCE:
    case _dragDrop.END_DRAG:
    case _dragDrop.DROP:
    default:
      return _dirtiness.ALL;
  }

  var _action$payload = action.payload,
      _action$payload$targe = _action$payload.targetIds,
      targetIds = _action$payload$targe === void 0 ? [] : _action$payload$targe,
      _action$payload$prevT = _action$payload.prevTargetIds,
      prevTargetIds = _action$payload$prevT === void 0 ? [] : _action$payload$prevT;
  var result = (0, _js_utils.xor)(targetIds, prevTargetIds);
  var didChange = result.length > 0 || !(0, _equality.areArraysEqual)(targetIds, prevTargetIds);

  if (!didChange) {
    return _dirtiness.NONE;
  } // Check the target ids at the innermost position. If they are valid, add them
  // to the result


  var prevInnermostTargetId = prevTargetIds[prevTargetIds.length - 1];
  var innermostTargetId = targetIds[targetIds.length - 1];

  if (prevInnermostTargetId !== innermostTargetId) {
    if (prevInnermostTargetId) {
      result.push(prevInnermostTargetId);
    }

    if (innermostTargetId) {
      result.push(innermostTargetId);
    }
  }

  return result;
}