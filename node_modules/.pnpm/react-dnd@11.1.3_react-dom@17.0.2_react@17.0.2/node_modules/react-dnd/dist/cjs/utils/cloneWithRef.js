"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cloneWithRef = cloneWithRef;

var _react = require("react");

var _invariant = require("@react-dnd/invariant");

function setRef(ref, node) {
  if (typeof ref === 'function') {
    ref(node);
  } else {
    ref.current = node;
  }
}

function cloneWithRef(element, newRef) {
  var previousRef = element.ref;
  (0, _invariant.invariant)(typeof previousRef !== 'string', 'Cannot connect React DnD to an element with an existing string ref. ' + 'Please convert it to use a callback ref instead, or wrap it into a <span> or <div>. ' + 'Read more: https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute');

  if (!previousRef) {
    // When there is no ref on the element, use the new ref directly
    return (0, _react.cloneElement)(element, {
      ref: newRef
    });
  } else {
    return (0, _react.cloneElement)(element, {
      ref: function ref(node) {
        setRef(previousRef, node);
        setRef(newRef, node);
      }
    });
  }
}