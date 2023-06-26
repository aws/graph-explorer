"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEndDrag = createEndDrag;

var _invariant = require("@react-dnd/invariant");

var _types = require("./types");

function createEndDrag(manager) {
  return function endDrag() {
    var monitor = manager.getMonitor();
    var registry = manager.getRegistry();
    verifyIsDragging(monitor);
    var sourceId = monitor.getSourceId();

    if (sourceId != null) {
      var source = registry.getSource(sourceId, true);
      source.endDrag(monitor, sourceId);
      registry.unpinSource();
    }

    return {
      type: _types.END_DRAG
    };
  };
}

function verifyIsDragging(monitor) {
  (0, _invariant.invariant)(monitor.isDragging(), 'Cannot call endDrag while not dragging.');
}