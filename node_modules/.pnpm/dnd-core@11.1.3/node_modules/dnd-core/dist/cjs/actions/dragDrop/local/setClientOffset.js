"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setClientOffset = setClientOffset;

var _types = require("../types");

function setClientOffset(clientOffset, sourceClientOffset) {
  return {
    type: _types.INIT_COORDS,
    payload: {
      sourceClientOffset: sourceClientOffset || null,
      clientOffset: clientOffset || null
    }
  };
}