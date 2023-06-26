"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPublishDragSource = createPublishDragSource;

var _types = require("./types");

function createPublishDragSource(manager) {
  return function publishDragSource() {
    var monitor = manager.getMonitor();

    if (monitor.isDragging()) {
      return {
        type: _types.PUBLISH_DRAG_SOURCE
      };
    }
  };
}