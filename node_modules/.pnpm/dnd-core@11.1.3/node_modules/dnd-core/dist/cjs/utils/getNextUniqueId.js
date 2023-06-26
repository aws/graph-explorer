"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNextUniqueId = getNextUniqueId;
var nextUniqueId = 0;

function getNextUniqueId() {
  return nextUniqueId++;
}