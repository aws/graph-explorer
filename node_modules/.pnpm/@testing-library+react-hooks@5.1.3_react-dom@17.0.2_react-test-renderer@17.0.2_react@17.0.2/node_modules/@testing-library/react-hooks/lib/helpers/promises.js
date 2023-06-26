"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveAfter = resolveAfter;
exports.callAfter = callAfter;

function resolveAfter(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callAfter(callback, ms) {
  await resolveAfter(ms);
  callback();
}