"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useDragDropManager = useDragDropManager;

var _react = require("react");

var _invariant = require("@react-dnd/invariant");

var _DndContext = require("../common/DndContext");

/**
 * A hook to retrieve the DragDropManager from Context
 */
function useDragDropManager() {
  var _useContext = (0, _react.useContext)(_DndContext.DndContext),
      dragDropManager = _useContext.dragDropManager;

  (0, _invariant.invariant)(dragDropManager != null, 'Expected drag drop context');
  return dragDropManager;
}