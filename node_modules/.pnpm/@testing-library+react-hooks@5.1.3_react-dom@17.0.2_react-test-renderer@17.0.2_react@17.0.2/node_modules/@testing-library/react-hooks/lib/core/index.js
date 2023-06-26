"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRenderHook = createRenderHook;
Object.defineProperty(exports, "cleanup", {
  enumerable: true,
  get: function () {
    return _cleanup.cleanup;
  }
});
Object.defineProperty(exports, "addCleanup", {
  enumerable: true,
  get: function () {
    return _cleanup.addCleanup;
  }
});
Object.defineProperty(exports, "removeCleanup", {
  enumerable: true,
  get: function () {
    return _cleanup.removeCleanup;
  }
});
Object.defineProperty(exports, "suppressErrorOutput", {
  enumerable: true,
  get: function () {
    return _console.suppressErrorOutput;
  }
});

var _asyncUtils = require("./asyncUtils");

var _cleanup = require("./cleanup");

var _console = require("./console");

function resultContainer() {
  const results = [];
  const resolvers = [];
  const result = {
    get all() {
      return results.map(({
        value,
        error
      }) => error != null ? error : value);
    },

    get current() {
      var _results;

      const {
        value,
        error
      } = (_results = results[results.length - 1]) != null ? _results : {};

      if (error) {
        throw error;
      }

      return value;
    },

    get error() {
      var _results2;

      const {
        error
      } = (_results2 = results[results.length - 1]) != null ? _results2 : {};
      return error;
    }

  };

  const updateResult = (value, error) => {
    results.push({
      value,
      error
    });
    resolvers.splice(0, resolvers.length).forEach(resolve => resolve());
  };

  return {
    result,
    addResolver: resolver => {
      resolvers.push(resolver);
    },
    setValue: value => updateResult(value),
    setError: error => updateResult(undefined, error)
  };
}

function createRenderHook(createRenderer) {
  const renderHook = (callback, options = {}) => {
    const {
      result,
      setValue,
      setError,
      addResolver
    } = resultContainer();
    const renderProps = {
      callback,
      setValue,
      setError
    };
    let hookProps = options.initialProps;
    const {
      render,
      rerender,
      unmount,
      act,
      ...renderUtils
    } = createRenderer(renderProps, options);
    render(hookProps);

    const rerenderHook = (newProps = hookProps) => {
      hookProps = newProps;
      rerender(hookProps);
    };

    const unmountHook = () => {
      (0, _cleanup.removeCleanup)(unmountHook);
      unmount();
    };

    (0, _cleanup.addCleanup)(unmountHook);
    return {
      result,
      rerender: rerenderHook,
      unmount: unmountHook,
      ...(0, _asyncUtils.asyncUtils)(act, addResolver),
      ...renderUtils
    };
  };

  return renderHook;
}